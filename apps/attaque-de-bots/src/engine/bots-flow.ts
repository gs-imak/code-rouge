// Attaque de Bots flow engine — the data-driven state machine behind the app.
//
// Pure TS: no React, no React-Native, no I/O. The "cœur" (navigation + answer
// validation + scoring + event log + serialisation) is unit-tested headlessly,
// exactly like the Assaut engine (apps/assaut/.../engine/assaut-sequence.ts).
// The React layer (useFlow + FlowRunner) is thin glue: it renders the screen
// for `currentView()` and dispatches typed events; it never branches on
// hardcoded step ids (immutable rule #2: architecture is data-driven).
//
// Shape of the flow:
//   prologue [connexion → accueil → tuto → choix]
//     → énigmes (config.variants[variant].steps, each an inner phase machine)
//       → epilogue [fin]  (terminal)
//
// Modern reducer API: one `dispatch(config, state, event, now)` drives every
// transition, so the binding is a plain useReducer and the machine is fully
// enumerable in tests.

import { z } from 'zod'
import {
  LogEvent,
  ParcoursVariantId,
  type LogEvent as LogEventT,
  type ParcoursConfig,
  type ParcoursStep,
  type ParcoursVariantId as ParcoursVariantIdT,
} from '@code-rouge/shared-types'
import { initialPhase, nextIntroPhase, type Phase } from './flow-templates.js'

export class FlowEngineError extends Error {
  override readonly name = 'FlowEngineError'
}

// Fixed bookend nodes. Their ids double as persisted `currentStep` values and
// as screen-registry keys. The variable middle (énigmes) comes from config.
export const PROLOGUE_NODES = ['connexion', 'accueil', 'tuto', 'choix'] as const
export const EPILOGUE_NODES = ['fin'] as const

export type Section = 'prologue' | 'enigmes' | 'epilogue'

export interface FlowState {
  readonly section: Section
  readonly variant: ParcoursVariantIdT
  /** Index into PROLOGUE_NODES / variant.steps / EPILOGUE_NODES per section. */
  readonly cursor: number
  /** Inner phase within the current node ('single' for non-compound nodes). */
  readonly phase: Phase
  /** Running score; énigme `points` accrue on a correct solve. */
  readonly score: number
  /** « Saisie » attempts on the current énigme (reset when leaving it). */
  readonly attempts: number
  /** The mail being read in a mailbox step, else null. */
  readonly openedMailId: string | null
  /** Append-only event log, pushed to the NUC at end of session. */
  readonly log: readonly LogEventT[]
}

export type FlowEvent =
  | { readonly type: 'CONTINUE' }
  | { readonly type: 'ANSWER'; readonly input: string }
  | { readonly type: 'RETRY' }
  | { readonly type: 'SET_VARIANT'; readonly variant: ParcoursVariantIdT }
  | { readonly type: 'OPEN_MAIL'; readonly mailId: string; readonly phishing: boolean }
  | { readonly type: 'BACK' }

export interface FlowView {
  readonly section: Section
  /** Stable id of the current node (= GameState.currentStep for server sync). */
  readonly nodeId: string
  /** Screen-registry key — what FlowRunner renders. */
  readonly viewKey: string
  /** The énigme kind when in the énigmes section, else null. */
  readonly kind: ParcoursStep['kind'] | null
  readonly phase: Phase
  /** The current énigme step config (solution/points/…), else null. */
  readonly step: ParcoursStep | null
  readonly score: number
  readonly attempts: number
  readonly canRetry: boolean
  readonly openedMailId: string | null
}

// -------------------------------------------------------------------- Helpers

function variantSteps(config: ParcoursConfig, state: FlowState): readonly ParcoursStep[] {
  const variant = config.variants.find((v) => v.id === state.variant)
  if (variant === undefined) {
    throw new FlowEngineError(`variant "${state.variant}" not present in config`)
  }
  return variant.steps
}

/** The current énigme step, or null outside the énigmes section. */
export function currentStep(config: ParcoursConfig, state: FlowState): ParcoursStep | null {
  if (state.section !== 'enigmes') return null
  return variantSteps(config, state)[state.cursor] ?? null
}

export function nodeId(config: ParcoursConfig, state: FlowState): string {
  switch (state.section) {
    case 'prologue':
      return PROLOGUE_NODES[state.cursor] ?? 'connexion'
    case 'enigmes':
      return currentStep(config, state)?.id ?? 'fin'
    case 'epilogue':
      return EPILOGUE_NODES[state.cursor] ?? 'fin'
  }
}

export function isComplete(state: FlowState): boolean {
  // Reaching the epilogue (fin) ends the session — there is nothing past it.
  return state.section === 'epilogue'
}

export function canRetry(config: ParcoursConfig, state: FlowState): boolean {
  if (state.phase !== 'error') return false
  const step = currentStep(config, state)
  if (step?.maxAttempts === undefined) return true
  return state.attempts < step.maxAttempts
}

/** trim + lowercase so « SECTION13 » and « section13 » match. */
export function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase()
}

function isCorrect(step: ParcoursStep, input: string): boolean {
  // No solution authored yet (placeholder content): accept any non-empty
  // input so the flow is walkable in dev. Logged as `unverified` downstream.
  if (step.solution === undefined) return input.trim().length > 0
  return normalizeAnswer(input) === normalizeAnswer(step.solution)
}

function appendLog(state: FlowState, now: number, kind: string, data?: LogEventT['data']): readonly LogEventT[] {
  const event: LogEventT = data === undefined ? { at: now, kind } : { at: now, kind, data }
  return [...state.log, event]
}

/** Position the state at its first énigme step (or epilogue if none). */
function enterEnigmes(config: ParcoursConfig, state: FlowState): FlowState {
  const steps = variantSteps(config, state)
  const first = steps[0]
  if (first === undefined) {
    return { ...state, section: 'epilogue', cursor: 0, phase: 'single' }
  }
  return { ...state, section: 'enigmes', cursor: 0, phase: initialPhase(first.kind), attempts: 0, openedMailId: null }
}

/** Move to the epilogue (fin) and log session completion. */
function enterEpilogue(state: FlowState, now: number): FlowState {
  return {
    ...state,
    section: 'epilogue',
    cursor: 0,
    phase: 'single',
    attempts: 0,
    openedMailId: null,
    log: appendLog(state, now, 'session-complete', { score: state.score }),
  }
}

/** Advance to the next OUTER node, crossing section boundaries as needed. */
function nextOuter(config: ParcoursConfig, state: FlowState, now: number): FlowState {
  switch (state.section) {
    case 'prologue': {
      const next = state.cursor + 1
      if (next < PROLOGUE_NODES.length) return { ...state, cursor: next, phase: 'single' }
      return enterEnigmes(config, state)
    }
    case 'enigmes': {
      const steps = variantSteps(config, state)
      const next = state.cursor + 1
      const step = steps[next]
      if (step !== undefined) {
        return { ...state, cursor: next, phase: initialPhase(step.kind), attempts: 0, openedMailId: null }
      }
      return enterEpilogue(state, now)
    }
    case 'epilogue':
      return state // terminal
  }
}

// -------------------------------------------------------------------- Reducer

export function dispatch(
  config: ParcoursConfig,
  state: FlowState,
  event: FlowEvent,
  now = 0,
): FlowState {
  switch (event.type) {
    case 'SET_VARIANT': {
      if (state.section !== 'prologue') {
        throw new FlowEngineError('SET_VARIANT is only valid during the prologue')
      }
      if (!config.variants.some((v) => v.id === event.variant)) {
        throw new FlowEngineError(`variant "${event.variant}" not present in config`)
      }
      return { ...state, variant: event.variant }
    }

    case 'BACK': {
      // Only meaningful inside a mailbox (close an open mail). Elsewhere a
      // no-op so the kiosk back affordance never throws.
      if (state.phase === 'reading' || state.phase === 'phishing') {
        return { ...state, phase: 'inbox', openedMailId: null }
      }
      return state
    }

    case 'RETRY': {
      if (state.phase !== 'error') {
        throw new FlowEngineError('RETRY is only valid on an error screen')
      }
      return { ...state, phase: 'saisie' }
    }

    case 'OPEN_MAIL': {
      if (state.phase !== 'inbox') {
        throw new FlowEngineError('OPEN_MAIL is only valid in a mailbox inbox')
      }
      if (event.phishing) {
        return {
          ...state,
          phase: 'phishing',
          openedMailId: event.mailId,
          log: appendLog(state, now, 'phishing-clicked', { mail: event.mailId, step: nodeId(config, state) }),
        }
      }
      return { ...state, phase: 'reading', openedMailId: event.mailId }
    }

    case 'ANSWER': {
      if (state.phase !== 'saisie') {
        throw new FlowEngineError('ANSWER is only valid on a saisie screen')
      }
      const step = currentStep(config, state)
      if (step === null) throw new FlowEngineError('ANSWER dispatched outside an énigme')
      if (isCorrect(step, event.input)) {
        return {
          ...state,
          phase: 'success',
          score: state.score + step.points,
          log: appendLog(state, now, 'enigme-solved', {
            step: step.id,
            kind: step.kind,
            attempts: state.attempts + 1,
            unverified: step.solution === undefined,
          }),
        }
      }
      return {
        ...state,
        phase: 'error',
        attempts: state.attempts + 1,
        log: appendLog(state, now, 'enigme-error', { step: step.id, attempts: state.attempts + 1 }),
      }
    }

    case 'CONTINUE': {
      switch (state.section) {
        case 'prologue':
          return nextOuter(config, state, now)
        case 'epilogue':
          return state // terminal
        case 'enigmes': {
          const step = currentStep(config, state)
          if (step === null) throw new FlowEngineError('no current énigme step')
          switch (state.phase) {
            case 'accueil':
            case 'loading':
              return { ...state, phase: nextIntroPhase(step.kind, state.phase) }
            case 'reading':
            case 'phishing':
              return { ...state, phase: 'inbox', openedMailId: null }
            case 'inbox':
            case 'success':
            case 'single':
              return nextOuter(config, state, now)
            case 'error':
              // While retries remain the player must RETRY; CONTINUE may only skip
              // the énigme once attempts are capped (the error screen shows
              // Continuer instead of Recommencer then). Guards against advancing
              // past an unsolved énigme while retries are still available.
              if (canRetry(config, state)) {
                throw new FlowEngineError('CONTINUE invalid while retries remain — dispatch RETRY')
              }
              return nextOuter(config, state, now)
            case 'saisie':
              throw new FlowEngineError('CONTINUE invalid on saisie — dispatch ANSWER')
          }
        }
      }
    }
  }
}

// -------------------------------------------------------------------- View

export function currentView(config: ParcoursConfig, state: FlowState): FlowView {
  const id = nodeId(config, state)
  const step = currentStep(config, state)
  const kind = step?.kind ?? null
  const viewKey = state.section === 'enigmes' && kind !== null ? `${kind}:${state.phase}` : id
  return {
    section: state.section,
    nodeId: id,
    viewKey,
    kind,
    phase: state.phase,
    step,
    score: state.score,
    attempts: state.attempts,
    canRetry: canRetry(config, state),
    openedMailId: state.openedMailId,
  }
}

// -------------------------------------------------------------------- Lifecycle

export function createFlow(config: ParcoursConfig, variant: ParcoursVariantIdT = 'A'): FlowState {
  if (!config.variants.some((v) => v.id === variant)) {
    throw new FlowEngineError(`variant "${variant}" not present in config`)
  }
  return {
    section: 'prologue',
    variant,
    cursor: 0,
    phase: 'single',
    score: 0,
    attempts: 0,
    openedMailId: null,
    log: [],
  }
}

// -------------------------------------------------------------------- Serialisation

const PHASES = [
  'single',
  'accueil',
  'loading',
  'saisie',
  'success',
  'error',
  'inbox',
  'reading',
  'phishing',
] as const

const FlowStateSchema = z.object({
  section: z.enum(['prologue', 'enigmes', 'epilogue']),
  variant: ParcoursVariantId,
  cursor: z.number().int().nonnegative(),
  phase: z.enum(PHASES),
  score: z.number().int(),
  attempts: z.number().int().nonnegative(),
  openedMailId: z.string().nullable(),
  log: z.array(LogEvent),
})

export function serializeFlow(state: FlowState): string {
  return JSON.stringify(state)
}

export function deserializeFlow(raw: string): FlowState {
  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    throw new FlowEngineError('invalid flow session JSON')
  }
  const result = FlowStateSchema.safeParse(json)
  if (!result.success) {
    throw new FlowEngineError(`invalid flow session shape — ${result.error.message}`)
  }
  const d = result.data
  return {
    section: d.section,
    variant: d.variant,
    cursor: d.cursor,
    phase: d.phase,
    score: d.score,
    attempts: d.attempts,
    openedMailId: d.openedMailId,
    log: d.log,
  }
}
