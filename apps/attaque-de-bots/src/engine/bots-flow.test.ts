import { describe, it, expect } from 'vitest'
import { parseParcoursConfig } from '@code-rouge/shared-types'
import {
  canRetry,
  createFlow,
  currentStep,
  currentView,
  deserializeFlow,
  dispatch,
  FlowEngineError,
  isComplete,
  nodeId,
  PROLOGUE_NODES,
  serializeFlow,
  type FlowState,
} from './bots-flow.js'

// Fixture covering every archetype: a mailbox (trap machine), a standard
// énigme (mdp), a bdd énigme (extra 'loading' intro phase), a single-screen
// kind (piratage) and a capped-attempts énigme (finale). Built through the
// real parser so the test exercises the same typed shape the app loads.
const config = parseParcoursConfig({
  schemaVersion: 1,
  variants: [
    {
      id: 'A',
      steps: [
        { id: 'm', kind: 'mailbox', estimatedDurationSec: 60, config: { mailboxId: 'x' } },
        { id: 'p', kind: 'mdp', estimatedDurationSec: 60, solution: '0-1-2', points: 100 },
        { id: 'b', kind: 'bdd', estimatedDurationSec: 60, solution: 'select', points: 50 },
        { id: 'pir', kind: 'piratage', estimatedDurationSec: 60 },
        { id: 'f', kind: 'finale', estimatedDurationSec: 60, solution: 'section13', points: 200, maxAttempts: 2 },
      ],
    },
    {
      id: 'B',
      steps: [{ id: 'b-only', kind: 'telephone', estimatedDurationSec: 60, solution: '1', points: 10 }],
    },
  ],
})

function walkPrologue(variant: 'A' | 'B' = 'A'): FlowState {
  let s = createFlow(config, variant)
  for (let i = 0; i < PROLOGUE_NODES.length; i++) s = dispatch(config, s, { type: 'CONTINUE' })
  return s
}

describe('createFlow', () => {
  it('starts on the connexion node in the prologue', () => {
    const s = createFlow(config, 'A')
    const v = currentView(config, s)
    expect(s.section).toBe('prologue')
    expect(v.nodeId).toBe('connexion')
    expect(v.viewKey).toBe('connexion')
    expect(v.phase).toBe('single')
    expect(v.score).toBe(0)
  })

  it('throws on a variant absent from the config', () => {
    expect(() => createFlow(config, 'C')).toThrowError(FlowEngineError)
  })
})

describe('prologue navigation', () => {
  it('walks connexion → accueil → tuto → choix → first énigme', () => {
    let s = createFlow(config, 'A')
    expect(nodeId(config, s)).toBe('connexion')
    s = dispatch(config, s, { type: 'CONTINUE' })
    expect(nodeId(config, s)).toBe('accueil')
    s = dispatch(config, s, { type: 'CONTINUE' })
    expect(nodeId(config, s)).toBe('tuto')
    s = dispatch(config, s, { type: 'CONTINUE' })
    expect(nodeId(config, s)).toBe('choix')
    s = dispatch(config, s, { type: 'CONTINUE' })
    expect(s.section).toBe('enigmes')
    expect(currentView(config, s).viewKey).toBe('mailbox:inbox')
  })

  it('SET_VARIANT in the prologue reroutes to that variant', () => {
    let s = createFlow(config, 'A')
    s = dispatch(config, s, { type: 'SET_VARIANT', variant: 'B' })
    for (let i = 0; i < PROLOGUE_NODES.length; i++) s = dispatch(config, s, { type: 'CONTINUE' })
    expect(currentStep(config, s)?.id).toBe('b-only')
  })

  it('SET_VARIANT after the prologue throws', () => {
    const s = walkPrologue('A')
    expect(() => dispatch(config, s, { type: 'SET_VARIANT', variant: 'B' })).toThrowError(FlowEngineError)
  })
})

describe('mailbox machine', () => {
  it('opens a legit mail then returns to the inbox', () => {
    let s = walkPrologue('A')
    expect(currentView(config, s).viewKey).toBe('mailbox:inbox')
    s = dispatch(config, s, { type: 'OPEN_MAIL', mailId: 'm1', phishing: false })
    expect(currentView(config, s).viewKey).toBe('mailbox:reading')
    expect(s.openedMailId).toBe('m1')
    s = dispatch(config, s, { type: 'BACK' })
    expect(currentView(config, s).viewKey).toBe('mailbox:inbox')
    expect(s.openedMailId).toBeNull()
  })

  it('opening the piégé mail fires + logs a phishing event', () => {
    let s = walkPrologue('A')
    s = dispatch(config, s, { type: 'OPEN_MAIL', mailId: 'trap', phishing: true }, 5)
    expect(currentView(config, s).viewKey).toBe('mailbox:phishing')
    const ev = s.log.find((e) => e.kind === 'phishing-clicked')
    expect(ev).toBeDefined()
    expect(ev?.at).toBe(5)
    expect(ev?.data?.mail).toBe('trap')
  })

  it('CONTINUE from the inbox completes the mailbox step', () => {
    let s = walkPrologue('A')
    s = dispatch(config, s, { type: 'CONTINUE' })
    expect(currentStep(config, s)?.id).toBe('p')
    expect(currentView(config, s).viewKey).toBe('mdp:accueil')
  })
})

describe('énigme machine', () => {
  function toMdpSaisie(): FlowState {
    let s = walkPrologue('A')
    s = dispatch(config, s, { type: 'CONTINUE' }) // mailbox inbox → mdp accueil
    s = dispatch(config, s, { type: 'CONTINUE' }) // accueil → saisie
    return s
  }

  it('accueil → saisie via CONTINUE', () => {
    const s = toMdpSaisie()
    expect(currentView(config, s).viewKey).toBe('mdp:saisie')
  })

  it('a wrong answer goes to error and logs it', () => {
    let s = toMdpSaisie()
    s = dispatch(config, s, { type: 'ANSWER', input: 'nope' })
    expect(currentView(config, s).viewKey).toBe('mdp:error')
    expect(s.attempts).toBe(1)
    expect(s.log.some((e) => e.kind === 'enigme-error')).toBe(true)
  })

  it('RETRY returns from error to saisie', () => {
    let s = toMdpSaisie()
    s = dispatch(config, s, { type: 'ANSWER', input: 'nope' })
    s = dispatch(config, s, { type: 'RETRY' })
    expect(currentView(config, s).viewKey).toBe('mdp:saisie')
  })

  it('CONTINUE on error is rejected while retries remain (mdp has no cap)', () => {
    let s = toMdpSaisie()
    s = dispatch(config, s, { type: 'ANSWER', input: 'nope' })
    expect(() => dispatch(config, s, { type: 'CONTINUE' })).toThrowError(FlowEngineError)
  })

  it('a correct answer awards points and logs the solve', () => {
    let s = toMdpSaisie()
    s = dispatch(config, s, { type: 'ANSWER', input: '0-1-2' }, 9)
    expect(currentView(config, s).viewKey).toBe('mdp:success')
    expect(s.score).toBe(100)
    const ev = s.log.find((e) => e.kind === 'enigme-solved')
    expect(ev?.data?.step).toBe('p')
    expect(ev?.at).toBe(9)
  })

  it('normalises the answer (case-insensitive, trimmed)', () => {
    let s = toMdpSaisie()
    s = dispatch(config, s, { type: 'ANSWER', input: '  0-1-2  ' })
    expect(s.phase).toBe('success')
  })

  it('bdd shows a loading interstitial between accueil and saisie', () => {
    let s = walkPrologue('A')
    s = dispatch(config, s, { type: 'CONTINUE' }) // → mdp accueil
    s = dispatch(config, s, { type: 'CONTINUE' }) // mdp accueil → saisie
    s = dispatch(config, s, { type: 'ANSWER', input: '0-1-2' }) // → success
    s = dispatch(config, s, { type: 'CONTINUE' }) // → bdd accueil
    expect(currentView(config, s).viewKey).toBe('bdd:accueil')
    s = dispatch(config, s, { type: 'CONTINUE' })
    expect(currentView(config, s).viewKey).toBe('bdd:loading')
    s = dispatch(config, s, { type: 'CONTINUE' })
    expect(currentView(config, s).viewKey).toBe('bdd:saisie')
    s = dispatch(config, s, { type: 'ANSWER', input: 'SELECT' })
    expect(s.phase).toBe('success')
    expect(s.score).toBe(150)
  })

  it('caps retries at maxAttempts', () => {
    // Drive to the finale saisie.
    let s = walkPrologue('A')
    s = dispatch(config, s, { type: 'CONTINUE' }) // mailbox done → mdp accueil
    s = dispatch(config, s, { type: 'CONTINUE' }) // mdp saisie
    s = dispatch(config, s, { type: 'ANSWER', input: '0-1-2' }) // success
    s = dispatch(config, s, { type: 'CONTINUE' }) // bdd accueil
    s = dispatch(config, s, { type: 'CONTINUE' }) // bdd loading
    s = dispatch(config, s, { type: 'CONTINUE' }) // bdd saisie
    s = dispatch(config, s, { type: 'ANSWER', input: 'select' }) // success
    s = dispatch(config, s, { type: 'CONTINUE' }) // piratage single
    s = dispatch(config, s, { type: 'CONTINUE' }) // finale accueil
    s = dispatch(config, s, { type: 'CONTINUE' }) // finale saisie
    expect(currentView(config, s).viewKey).toBe('finale:saisie')
    s = dispatch(config, s, { type: 'ANSWER', input: 'wrong' }) // attempt 1 → error
    expect(canRetry(config, s)).toBe(true)
    s = dispatch(config, s, { type: 'RETRY' })
    s = dispatch(config, s, { type: 'ANSWER', input: 'wrong' }) // attempt 2 → error, capped
    expect(s.attempts).toBe(2)
    expect(canRetry(config, s)).toBe(false)
    // Capped → CONTINUE now skips the unsolved finale to the epilogue.
    s = dispatch(config, s, { type: 'CONTINUE' })
    expect(isComplete(s)).toBe(true)
  })
})

describe('full happy path', () => {
  it('reaches fin with the summed score and a complete log', () => {
    let s = walkPrologue('A')
    s = dispatch(config, s, { type: 'CONTINUE' }) // mailbox → mdp accueil
    s = dispatch(config, s, { type: 'CONTINUE' }) // mdp saisie
    s = dispatch(config, s, { type: 'ANSWER', input: '0-1-2' })
    s = dispatch(config, s, { type: 'CONTINUE' }) // bdd accueil
    s = dispatch(config, s, { type: 'CONTINUE' }) // bdd loading
    s = dispatch(config, s, { type: 'CONTINUE' }) // bdd saisie
    s = dispatch(config, s, { type: 'ANSWER', input: 'select' })
    s = dispatch(config, s, { type: 'CONTINUE' }) // piratage
    s = dispatch(config, s, { type: 'CONTINUE' }) // finale accueil
    s = dispatch(config, s, { type: 'CONTINUE' }) // finale saisie
    s = dispatch(config, s, { type: 'ANSWER', input: 'SECTION13' })
    s = dispatch(config, s, { type: 'CONTINUE' }) // finale success → epilogue
    expect(isComplete(s)).toBe(true)
    expect(nodeId(config, s)).toBe('fin')
    expect(s.score).toBe(350)
    expect(s.log.some((e) => e.kind === 'session-complete')).toBe(true)
  })

  it('CONTINUE on the terminal epilogue is a no-op', () => {
    let s = walkPrologue('A')
    // jump to epilogue by skipping every énigme via error→continue is long;
    // instead reuse the happy path's terminal state.
    s = dispatch(config, s, { type: 'CONTINUE' })
    s = dispatch(config, s, { type: 'CONTINUE' })
    s = dispatch(config, s, { type: 'ANSWER', input: '0-1-2' })
    s = dispatch(config, s, { type: 'CONTINUE' })
    s = dispatch(config, s, { type: 'CONTINUE' })
    s = dispatch(config, s, { type: 'CONTINUE' })
    s = dispatch(config, s, { type: 'ANSWER', input: 'select' })
    s = dispatch(config, s, { type: 'CONTINUE' })
    s = dispatch(config, s, { type: 'CONTINUE' })
    s = dispatch(config, s, { type: 'CONTINUE' })
    s = dispatch(config, s, { type: 'ANSWER', input: 'SECTION13' })
    s = dispatch(config, s, { type: 'CONTINUE' })
    const before = serializeFlow(s)
    const after = dispatch(config, s, { type: 'CONTINUE' })
    expect(serializeFlow(after)).toBe(before)
  })
})

describe('misuse guards', () => {
  it('CONTINUE on a saisie screen throws', () => {
    let s = walkPrologue('A')
    s = dispatch(config, s, { type: 'CONTINUE' }) // mdp accueil
    s = dispatch(config, s, { type: 'CONTINUE' }) // mdp saisie
    expect(() => dispatch(config, s, { type: 'CONTINUE' })).toThrowError(FlowEngineError)
  })

  it('ANSWER off a saisie screen throws', () => {
    const s = walkPrologue('A') // mailbox inbox
    expect(() => dispatch(config, s, { type: 'ANSWER', input: 'x' })).toThrowError(FlowEngineError)
  })

  it('RETRY off an error screen throws', () => {
    const s = walkPrologue('A')
    expect(() => dispatch(config, s, { type: 'RETRY' })).toThrowError(FlowEngineError)
  })

  it('OPEN_MAIL outside an inbox throws', () => {
    let s = walkPrologue('A')
    s = dispatch(config, s, { type: 'CONTINUE' }) // mdp accueil
    expect(() =>
      dispatch(config, s, { type: 'OPEN_MAIL', mailId: 'm', phishing: false }),
    ).toThrowError(FlowEngineError)
  })

  it('does not mutate the input state', () => {
    const s = walkPrologue('A')
    const snapshot = serializeFlow(s)
    dispatch(config, s, { type: 'OPEN_MAIL', mailId: 'm', phishing: true }, 1)
    expect(serializeFlow(s)).toBe(snapshot)
  })
})

describe('serialisation', () => {
  it('round-trips a mid-flow state', () => {
    let s = walkPrologue('A')
    s = dispatch(config, s, { type: 'OPEN_MAIL', mailId: 'trap', phishing: true }, 7)
    const restored = deserializeFlow(serializeFlow(s))
    expect(restored).toEqual(s)
  })

  it('rejects invalid JSON', () => {
    expect(() => deserializeFlow('{not json')).toThrowError(FlowEngineError)
  })

  it('rejects a structurally invalid blob', () => {
    expect(() => deserializeFlow(JSON.stringify({ section: 'bogus' }))).toThrowError(FlowEngineError)
  })
})
