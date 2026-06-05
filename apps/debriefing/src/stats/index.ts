// Débriefing stats engine — pure functions over the teams' event logs.
//
// No React, no I/O: the GM-facing aggregation (per-team + global stats, the
// numbers driving the projected slides) is computed here so it is unit-tested
// headlessly. Per docs/conventions/debriefing.md this is the single
// highest-leverage area for tests — Nathanael demos these figures to clients.
//
// Input is the Attaque-de-Bots event log (the kinds the flow engine emits:
// `phishing-clicked`, `enigme-solved` {step,kind,attempts}, `enigme-error`
// {step,attempts}, `session-complete` {score}). Unknown kinds are ignored, so
// adding event kinds never breaks the aggregation.

import type { LogEvent } from '@code-rouge/shared-types'

export interface EnigmeResult {
  readonly step: string
  readonly kind?: string
  /** Tries taken — the solve attempt number, or the highest error attempt. */
  readonly attempts: number
  /** Number of wrong answers logged for this énigme. */
  readonly errors: number
  readonly solved: boolean
}

export interface TeamStats {
  readonly teamId: number
  /** Final « % données / points » from session-complete; 0 if never finished. */
  readonly score: number
  readonly completed: boolean
  readonly phishingClicks: number
  readonly solvedCount: number
  readonly errorCount: number
  readonly enigmes: readonly EnigmeResult[]
}

export interface GlobalStats {
  readonly teamCount: number
  readonly averageScore: number
  readonly bestTeamId: number | null
  readonly completedCount: number
  readonly totalPhishingClicks: number
  /** The énigme that cost the most wrong answers across all teams. */
  readonly hardestEnigme: { readonly step: string; readonly errors: number } | null
}

export interface SessionStats {
  readonly teams: readonly TeamStats[]
  readonly global: GlobalStats
}

function readString(data: LogEvent['data'], key: string): string | undefined {
  const value = data?.[key]
  return typeof value === 'string' ? value : undefined
}

function readNumber(data: LogEvent['data'], key: string): number | undefined {
  const value = data?.[key]
  return typeof value === 'number' ? value : undefined
}

interface MutableEnigme {
  step: string
  kind?: string
  attempts: number
  errors: number
  solved: boolean
}

export function computeTeamStats(teamId: number, events: readonly LogEvent[]): TeamStats {
  let score = 0
  let completed = false
  let phishingClicks = 0
  const enigmes = new Map<string, MutableEnigme>()
  const ensure = (step: string): MutableEnigme => {
    let entry = enigmes.get(step)
    if (entry === undefined) {
      entry = { step, attempts: 0, errors: 0, solved: false }
      enigmes.set(step, entry)
    }
    return entry
  }

  for (const ev of events) {
    switch (ev.kind) {
      case 'phishing-clicked':
        phishingClicks += 1
        break
      case 'session-complete': {
        completed = true
        const s = readNumber(ev.data, 'score')
        if (s !== undefined) score = s
        break
      }
      case 'enigme-solved': {
        const step = readString(ev.data, 'step')
        if (step !== undefined) {
          const entry = ensure(step)
          entry.solved = true
          const a = readNumber(ev.data, 'attempts')
          if (a !== undefined) entry.attempts = a
          const k = readString(ev.data, 'kind')
          if (k !== undefined) entry.kind = k
        }
        break
      }
      case 'enigme-error': {
        const step = readString(ev.data, 'step')
        if (step !== undefined) {
          const entry = ensure(step)
          entry.errors += 1
          const a = readNumber(ev.data, 'attempts')
          if (a !== undefined && a > entry.attempts) entry.attempts = a
        }
        break
      }
      default:
        break
    }
  }

  const list = [...enigmes.values()]
  return {
    teamId,
    score,
    completed,
    phishingClicks,
    solvedCount: list.filter((e) => e.solved).length,
    errorCount: list.reduce((n, e) => n + e.errors, 0),
    enigmes: list.map((e) =>
      e.kind === undefined
        ? { step: e.step, attempts: e.attempts, errors: e.errors, solved: e.solved }
        : { step: e.step, kind: e.kind, attempts: e.attempts, errors: e.errors, solved: e.solved },
    ),
  }
}

export function computeGlobalStats(teams: readonly TeamStats[]): GlobalStats {
  const teamCount = teams.length
  if (teamCount === 0) {
    return {
      teamCount: 0,
      averageScore: 0,
      bestTeamId: null,
      completedCount: 0,
      totalPhishingClicks: 0,
      hardestEnigme: null,
    }
  }

  const totalScore = teams.reduce((n, t) => n + t.score, 0)
  // Ties resolve to the first (lowest-index) team — `>` is strict.
  const best = teams.reduce((a, b) => (b.score > a.score ? b : a))

  const errorsByStep = new Map<string, number>()
  for (const t of teams) {
    for (const e of t.enigmes) {
      errorsByStep.set(e.step, (errorsByStep.get(e.step) ?? 0) + e.errors)
    }
  }
  let hardestEnigme: { step: string; errors: number } | null = null
  for (const [step, errors] of errorsByStep) {
    if (errors > 0 && (hardestEnigme === null || errors > hardestEnigme.errors)) {
      hardestEnigme = { step, errors }
    }
  }

  return {
    teamCount,
    averageScore: Math.round(totalScore / teamCount),
    bestTeamId: best.teamId,
    completedCount: teams.filter((t) => t.completed).length,
    totalPhishingClicks: teams.reduce((n, t) => n + t.phishingClicks, 0),
    hardestEnigme,
  }
}

/** Convenience: per-team + global stats from each team's pulled event log. */
export function computeSessionStats(
  teamLogs: readonly { readonly teamId: number; readonly events: readonly LogEvent[] }[],
): SessionStats {
  const teams = teamLogs.map((t) => computeTeamStats(t.teamId, t.events))
  return { teams, global: computeGlobalStats(teams) }
}
