import { describe, it, expect } from 'vitest'
import type { LogEvent } from '@code-rouge/shared-types'
import {
  computeGlobalStats,
  computeSessionStats,
  computeTeamStats,
  type TeamStats,
} from './index.js'

// A representative Attaque-de-Bots log: one énigme solved on the 2nd try (1 error),
// a phishing click, a second énigme solved first try, then session completion.
const teamALog: readonly LogEvent[] = [
  { at: 1, kind: 'enigme-error', data: { step: 'a-mdp', attempts: 1 } },
  { at: 2, kind: 'enigme-solved', data: { step: 'a-mdp', kind: 'mdp', attempts: 2, unverified: false } },
  { at: 3, kind: 'phishing-clicked', data: { mail: 'phishing-update-creds', step: 'a-mailbox' } },
  { at: 4, kind: 'enigme-solved', data: { step: 'a-telephone', kind: 'telephone', attempts: 1 } },
  { at: 5, kind: 'session-complete', data: { score: 200 } },
]

// A team that never solved the mdp (3 errors) but still completed with a lower score.
const teamBLog: readonly LogEvent[] = [
  { at: 1, kind: 'enigme-error', data: { step: 'a-mdp', attempts: 1 } },
  { at: 2, kind: 'enigme-error', data: { step: 'a-mdp', attempts: 2 } },
  { at: 3, kind: 'enigme-error', data: { step: 'a-mdp', attempts: 3 } },
  { at: 4, kind: 'session-complete', data: { score: 100 } },
]

describe('computeTeamStats', () => {
  it('aggregates score, completion, phishing, solves and per-énigme results', () => {
    const s = computeTeamStats(1, teamALog)
    expect(s.teamId).toBe(1)
    expect(s.score).toBe(200)
    expect(s.completed).toBe(true)
    expect(s.phishingClicks).toBe(1)
    expect(s.solvedCount).toBe(2)
    expect(s.errorCount).toBe(1)
    const mdp = s.enigmes.find((e) => e.step === 'a-mdp')
    expect(mdp).toEqual({ step: 'a-mdp', kind: 'mdp', attempts: 2, errors: 1, solved: true })
    const tel = s.enigmes.find((e) => e.step === 'a-telephone')
    expect(tel).toMatchObject({ attempts: 1, errors: 0, solved: true })
  })

  it('marks an unfinished session and an unsolved énigme', () => {
    const s = computeTeamStats(2, teamBLog)
    expect(s.score).toBe(100)
    expect(s.completed).toBe(true)
    expect(s.solvedCount).toBe(0)
    expect(s.errorCount).toBe(3)
    expect(s.enigmes.find((e) => e.step === 'a-mdp')).toMatchObject({ errors: 3, attempts: 3, solved: false })
  })

  it('returns zeros for an empty log (logs missing / team offline)', () => {
    const s = computeTeamStats(9, [])
    expect(s).toEqual({
      teamId: 9,
      score: 0,
      completed: false,
      phishingClicks: 0,
      solvedCount: 0,
      errorCount: 0,
      enigmes: [],
    })
  })

  it('ignores unknown event kinds (forward-compatible)', () => {
    const s = computeTeamStats(1, [{ at: 1, kind: 'some-future-kind', data: { x: 1 } }])
    expect(s.enigmes).toEqual([])
    expect(s.score).toBe(0)
  })
})

describe('computeGlobalStats', () => {
  const teams: readonly TeamStats[] = [
    computeTeamStats(1, teamALog),
    computeTeamStats(2, teamBLog),
    computeTeamStats(3, []),
  ]

  it('computes average, best team, completion and phishing totals', () => {
    const g = computeGlobalStats(teams)
    expect(g.teamCount).toBe(3)
    expect(g.averageScore).toBe(100) // (200 + 100 + 0) / 3
    expect(g.bestTeamId).toBe(1)
    expect(g.completedCount).toBe(2)
    expect(g.totalPhishingClicks).toBe(1)
  })

  it('finds the hardest énigme by total errors across teams', () => {
    const g = computeGlobalStats(teams)
    // a-mdp: 1 error (team 1) + 3 errors (team 2) = 4
    expect(g.hardestEnigme).toEqual({ step: 'a-mdp', errors: 4 })
  })

  it('returns neutral stats for zero teams', () => {
    expect(computeGlobalStats([])).toEqual({
      teamCount: 0,
      averageScore: 0,
      bestTeamId: null,
      completedCount: 0,
      totalPhishingClicks: 0,
      hardestEnigme: null,
    })
  })

  it('breaks a best-score tie toward the first team', () => {
    const a = computeTeamStats(5, [{ at: 1, kind: 'session-complete', data: { score: 50 } }])
    const b = computeTeamStats(6, [{ at: 1, kind: 'session-complete', data: { score: 50 } }])
    expect(computeGlobalStats([a, b]).bestTeamId).toBe(5)
  })

  it('reports no hardest énigme when nobody erred', () => {
    const clean = computeTeamStats(1, [{ at: 1, kind: 'enigme-solved', data: { step: 'a-mdp', attempts: 1 } }])
    expect(computeGlobalStats([clean]).hardestEnigme).toBeNull()
  })
})

describe('computeSessionStats', () => {
  it('returns per-team + global stats from pulled logs', () => {
    const result = computeSessionStats([
      { teamId: 1, events: teamALog },
      { teamId: 2, events: teamBLog },
    ])
    expect(result.teams.map((t) => t.teamId)).toEqual([1, 2])
    expect(result.global.teamCount).toBe(2)
    expect(result.global.bestTeamId).toBe(1)
  })
})
