// Assaut sequence engine — the data-driven state machine behind the « Assaut »
// app (M2 chantier 02 / 04). Pure TS: no React, no Electron, no I/O, so the
// "cœur testé à 100%" (M2 doc: scoring + machine à états + sérialisation) is
// unit-tested headlessly. The renderer is thin glue — it renders the screen
// for `currentStepId` and persists the serialized session; it never branches
// on hardcoded step ids (immutable rule #2: architecture is data-driven).
//
// Score model: a single 0-100 "% de données récupérées". Choices (prep) and
// conditional transitions (assault) carry signed deltas; the engine clamps
// the running total to [0, 100]. Exact weights live in the config JSON.

import { z } from 'zod'
import type {
  AssautPrepStep,
  AssautSequenceConfig,
  AssautStep,
} from '@code-rouge/shared-types'

export class AssautEngineError extends Error {
  override readonly name = 'AssautEngineError'
}

export type AssautPhase = 'prep' | 'assault' | 'complete'

export interface AssautSession {
  /** Which phase the player is in; `complete` once past the final step. */
  readonly phase: AssautPhase
  /** Id of the active step, or `null` when complete. */
  readonly currentStepId: string | null
  /** Resolved branching choices, keyed by the prep step id. */
  readonly choices: Readonly<Record<string, string>>
  /** Running "% de données récupérées", clamped to [0, 100]. */
  readonly dataRecoveredPercent: number
  /** Ordered visit history (may repeat if a branch loops back). */
  readonly visited: readonly string[]
}

// Validates a deserialized session before trusting it (a persisted blob can
// be corrupted or version-skewed). Mirrors AssautSession.
const AssautSessionSchema = z.object({
  phase: z.enum(['prep', 'assault', 'complete']),
  currentStepId: z.string().min(1).nullable(),
  choices: z.record(z.string()),
  dataRecoveredPercent: z.number().int().min(0).max(100),
  visited: z.array(z.string()),
})

export function clampPercent(n: number): number {
  return Math.max(0, Math.min(100, n))
}

/** Flat navigation order: prep steps first, then assault steps. */
function flowIds(config: AssautSequenceConfig): string[] {
  return [...config.prep.map((p) => p.id), ...config.steps.map((s) => s.id)]
}

export function phaseOf(config: AssautSequenceConfig, stepId: string): 'prep' | 'assault' {
  return config.prep.some((p) => p.id === stepId) ? 'prep' : 'assault'
}

/** True if `id` names a real step anywhere in the flow (prep or assault). */
export function hasStep(config: AssautSequenceConfig, id: string): boolean {
  return config.prep.some((p) => p.id === id) || config.steps.some((s) => s.id === id)
}

function findPrep(config: AssautSequenceConfig, id: string): AssautPrepStep | undefined {
  return config.prep.find((p) => p.id === id)
}

function findStep(config: AssautSequenceConfig, id: string): AssautStep | undefined {
  return config.steps.find((s) => s.id === id)
}

function linearNext(config: AssautSequenceConfig, stepId: string): string | null {
  const order = flowIds(config)
  return order[order.indexOf(stepId) + 1] ?? null
}

/** Move to `targetId` (or complete when null), applying a clamped score delta. */
function moveTo(
  config: AssautSequenceConfig,
  session: AssautSession,
  targetId: string | null,
  delta: number,
): AssautSession {
  const dataRecoveredPercent = clampPercent(session.dataRecoveredPercent + delta)
  if (targetId === null) {
    return { ...session, phase: 'complete', currentStepId: null, dataRecoveredPercent }
  }
  return {
    ...session,
    phase: phaseOf(config, targetId),
    currentStepId: targetId,
    dataRecoveredPercent,
    visited: [...session.visited, targetId],
  }
}

export function createSession(config: AssautSequenceConfig): AssautSession {
  const firstId = flowIds(config)[0]
  if (firstId === undefined) {
    // Unreachable: the schema requires ≥1 assault step. Guard for safety.
    throw new AssautEngineError('config has no steps')
  }
  return {
    phase: phaseOf(config, firstId),
    currentStepId: firstId,
    choices: {},
    dataRecoveredPercent: clampPercent(config.scoring.startPercent),
    visited: [firstId],
  }
}

export function currentStep(
  config: AssautSequenceConfig,
  session: AssautSession,
): AssautPrepStep | AssautStep | null {
  if (session.currentStepId === null) return null
  return findPrep(config, session.currentStepId) ?? findStep(config, session.currentStepId) ?? null
}

/**
 * Advance a non-choice step. For an assault step, the first transition whose
 * `when` matches `event` wins (applying its delta); otherwise the flow moves
 * linearly to the next step. Throws if called on a prep step that still has
 * choices to resolve — use {@link applyChoice} there.
 */
export function advance(
  config: AssautSequenceConfig,
  session: AssautSession,
  event?: string,
): AssautSession {
  const id = session.currentStepId
  if (id === null) {
    throw new AssautEngineError('cannot advance a completed session')
  }
  const prep = findPrep(config, id)
  if (prep && prep.choices.length > 0) {
    throw new AssautEngineError(`step "${id}" requires applyChoice`)
  }
  const step = findStep(config, id)
  if (step && event !== undefined) {
    const transition = step.transitions.find((t) => t.when === event)
    if (transition) {
      return moveTo(config, session, transition.goto, transition.dataRecoveredDelta)
    }
  }
  return moveTo(config, session, linearNext(config, id), 0)
}

/**
 * Resolve a branching choice on the current prep step: apply its score delta,
 * record it, and move to its `goto` target (or linearly when absent).
 */
export function applyChoice(
  config: AssautSequenceConfig,
  session: AssautSession,
  choiceId: string,
): AssautSession {
  const id = session.currentStepId
  if (id === null) {
    throw new AssautEngineError('cannot choose on a completed session')
  }
  const prep = findPrep(config, id)
  if (!prep || prep.choices.length === 0) {
    throw new AssautEngineError(`step "${id}" has no choices`)
  }
  const choice = prep.choices.find((c) => c.id === choiceId)
  if (!choice) {
    throw new AssautEngineError(`unknown choice "${choiceId}" on step "${id}"`)
  }
  const moved = moveTo(config, session, choice.goto ?? linearNext(config, id), choice.dataRecoveredDelta)
  return { ...moved, choices: { ...session.choices, [id]: choiceId } }
}

export function isComplete(session: AssautSession): boolean {
  return session.phase === 'complete'
}

export function serializeSession(session: AssautSession): string {
  return JSON.stringify(session)
}

export function deserializeSession(raw: string): AssautSession {
  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    throw new AssautEngineError('invalid session JSON')
  }
  const result = AssautSessionSchema.safeParse(json)
  if (!result.success) {
    throw new AssautEngineError(`invalid session shape — ${result.error.message}`)
  }
  return result.data
}
