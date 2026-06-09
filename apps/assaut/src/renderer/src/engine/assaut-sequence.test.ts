import { describe, expect, it } from 'vitest'
import { parseAssautSequenceConfig, type AssautSequenceConfig } from '@code-rouge/shared-types'
import {
  AssautEngineError,
  advance,
  applyChoice,
  createSession,
  currentStep,
  deserializeSession,
  isComplete,
  serializeSession,
} from './assaut-sequence'

// A representative config exercising both phases, a linear path, a branch
// from a prep choice, and a conditional transition on an assault step.
// Flow order: acces → approche → debut → patrouille → epilogue.
function buildConfig(): AssautSequenceConfig {
  return parseAssautSequenceConfig({
    schemaVersion: 1,
    scoring: { startPercent: 50 },
    prep: [
      { id: 'acces', kind: 'saisie-acces' },
      {
        id: 'approche',
        kind: 'choix-approche',
        choices: [
          { id: 'frontale', label: 'Approche frontale', dataRecoveredDelta: 10 },
          { id: 'furtive', label: 'Approche furtive', dataRecoveredDelta: -5, goto: 'patrouille' },
        ],
      },
    ],
    steps: [
      { id: 'debut', kind: 'debut', mediaPath: 'media/debut.mp4' },
      {
        id: 'patrouille',
        kind: 'patrouille',
        mediaPath: 'media/patrouille.mp4',
        transitions: [{ when: 'spotted', goto: 'epilogue', dataRecoveredDelta: -20 }],
      },
      { id: 'epilogue', kind: 'epilogue', mediaPath: 'media/epilogue.mp4' },
    ],
  })
}

describe('createSession', () => {
  it('starts at the first prep step when a prep phase exists', () => {
    const s = createSession(buildConfig())
    expect(s.phase).toBe('prep')
    expect(s.currentStepId).toBe('acces')
    expect(s.visited).toEqual(['acces'])
  })

  it('seeds the score from scoring.startPercent', () => {
    expect(createSession(buildConfig()).dataRecoveredPercent).toBe(50)
  })

  it('starts in the assault phase when there is no prep', () => {
    const config = parseAssautSequenceConfig({
      schemaVersion: 1,
      steps: [{ id: 'debut', kind: 'debut', mediaPath: 'media/debut.mp4' }],
    })
    const s = createSession(config)
    expect(s.phase).toBe('assault')
    expect(s.currentStepId).toBe('debut')
  })
})

describe('currentStep', () => {
  it('resolves the current prep step object', () => {
    const config = buildConfig()
    const step = currentStep(config, createSession(config))
    expect(step?.id).toBe('acces')
    expect(step?.kind).toBe('saisie-acces')
  })

  it('returns null once the session is complete', () => {
    const config = buildConfig()
    let s = createSession(config)
    // walk to the end: acces → approche →(frontale) debut → patrouille → epilogue → complete
    s = advance(config, s) // acces → approche
    s = applyChoice(config, s, 'frontale') // approche → debut
    s = advance(config, s) // debut → patrouille
    s = advance(config, s) // patrouille → epilogue
    s = advance(config, s) // epilogue → complete
    expect(currentStep(config, s)).toBeNull()
  })
})

describe('advance — linear and phase change', () => {
  it('moves to the next step in flow order with no score change', () => {
    const config = buildConfig()
    const s = advance(config, createSession(config))
    expect(s.currentStepId).toBe('approche')
    expect(s.phase).toBe('prep')
    expect(s.dataRecoveredPercent).toBe(50)
    expect(s.visited).toEqual(['acces', 'approche'])
  })

  it('crosses from prep into assault when prep is exhausted', () => {
    const config = buildConfig()
    let s = createSession(config)
    s = advance(config, s) // acces → approche
    s = applyChoice(config, s, 'frontale') // approche → debut (linear, no goto)
    expect(s.phase).toBe('assault')
    expect(s.currentStepId).toBe('debut')
  })

  it('refuses to advance a choice step — that needs applyChoice', () => {
    const config = buildConfig()
    const atApproche = advance(config, createSession(config))
    expect(() => advance(config, atApproche)).toThrowError(AssautEngineError)
  })

  it('completes when advancing past the final step', () => {
    const config = buildConfig()
    let s = createSession(config)
    s = advance(config, s)
    s = applyChoice(config, s, 'frontale')
    s = advance(config, s) // debut → patrouille
    s = advance(config, s) // patrouille → epilogue
    s = advance(config, s) // epilogue → complete
    expect(s.phase).toBe('complete')
    expect(s.currentStepId).toBeNull()
    expect(isComplete(s)).toBe(true)
  })
})

describe('advance — conditional transitions', () => {
  it('takes a matching transition and applies its delta', () => {
    const config = buildConfig()
    let s = createSession(config)
    s = advance(config, s)
    s = applyChoice(config, s, 'frontale') // at debut, score 60
    s = advance(config, s) // debut → patrouille
    s = advance(config, s, 'spotted') // transition → epilogue, -20
    expect(s.currentStepId).toBe('epilogue')
    expect(s.dataRecoveredPercent).toBe(40)
  })

  it('falls through to linear next when no transition matches the event', () => {
    const config = buildConfig()
    let s = createSession(config)
    s = advance(config, s)
    s = applyChoice(config, s, 'frontale')
    s = advance(config, s) // debut → patrouille
    s = advance(config, s, 'no-such-event') // → linear next = epilogue, no delta
    expect(s.currentStepId).toBe('epilogue')
    expect(s.dataRecoveredPercent).toBe(60)
  })
})

describe('applyChoice', () => {
  it('applies the choice delta, records the choice, and advances linearly when no goto', () => {
    const config = buildConfig()
    const atApproche = advance(config, createSession(config))
    const s = applyChoice(config, atApproche, 'frontale')
    expect(s.dataRecoveredPercent).toBe(60)
    expect(s.choices).toEqual({ approche: 'frontale' })
    expect(s.currentStepId).toBe('debut')
  })

  it('follows the choice goto branch when present', () => {
    const config = buildConfig()
    const atApproche = advance(config, createSession(config))
    const s = applyChoice(config, atApproche, 'furtive')
    expect(s.currentStepId).toBe('patrouille')
    expect(s.dataRecoveredPercent).toBe(45)
  })

  it('throws on an unknown choice id', () => {
    const config = buildConfig()
    const atApproche = advance(config, createSession(config))
    expect(() => applyChoice(config, atApproche, 'nope')).toThrowError(AssautEngineError)
  })

  it('throws when the current step has no choices', () => {
    const config = buildConfig()
    expect(() => applyChoice(config, createSession(config), 'frontale')).toThrowError(
      AssautEngineError,
    )
  })
})

describe('score clamping', () => {
  it('floors the running percentage at 0', () => {
    const config = parseAssautSequenceConfig({
      schemaVersion: 1,
      scoring: { startPercent: 5 },
      prep: [
        {
          id: 'approche',
          kind: 'choix-approche',
          choices: [{ id: 'furtive', label: 'Furtive', dataRecoveredDelta: -50 }],
        },
      ],
      steps: [{ id: 'debut', kind: 'debut', mediaPath: 'media/debut.mp4' }],
    })
    const s = applyChoice(config, createSession(config), 'furtive')
    expect(s.dataRecoveredPercent).toBe(0)
  })

  it('caps the running percentage at 100', () => {
    const config = parseAssautSequenceConfig({
      schemaVersion: 1,
      scoring: { startPercent: 95 },
      prep: [
        {
          id: 'approche',
          kind: 'choix-approche',
          choices: [{ id: 'frontale', label: 'Frontale', dataRecoveredDelta: 20 }],
        },
      ],
      steps: [{ id: 'debut', kind: 'debut', mediaPath: 'media/debut.mp4' }],
    })
    const s = applyChoice(config, createSession(config), 'frontale')
    expect(s.dataRecoveredPercent).toBe(100)
  })
})

describe('serialize / deserialize', () => {
  it('round-trips a session', () => {
    const config = buildConfig()
    const s = applyChoice(config, advance(config, createSession(config)), 'furtive')
    expect(deserializeSession(serializeSession(s))).toEqual(s)
  })

  it('throws on non-JSON input', () => {
    expect(() => deserializeSession('{not json')).toThrowError(AssautEngineError)
  })

  it('throws on a structurally invalid session', () => {
    expect(() => deserializeSession(JSON.stringify({ phase: 'bogus' }))).toThrowError(
      AssautEngineError,
    )
  })
})

// The GM point-d'accès loop: prep steps now carry event-driven transitions
// (mirrors assault steps). point-entree --approved/refused--> valide/refus;
// valide --continue--> choix-approche; refus --retry--> point-entree.
function buildAccessConfig(): AssautSequenceConfig {
  return parseAssautSequenceConfig({
    schemaVersion: 1,
    scoring: { startPercent: 0 },
    prep: [
      {
        id: 'point-entree',
        kind: 'point-entree',
        transitions: [
          { when: 'approved', goto: 'point-acces-valide' },
          { when: 'refused', goto: 'point-acces-refus' },
        ],
      },
      {
        id: 'point-acces-valide',
        kind: 'point-acces-valide',
        transitions: [{ when: 'continue', goto: 'choix-approche' }],
      },
      {
        id: 'point-acces-refus',
        kind: 'point-acces-refus',
        transitions: [{ when: 'retry', goto: 'point-entree' }],
      },
      {
        id: 'choix-approche',
        kind: 'choix-approche',
        choices: [{ id: 'frontale', label: 'Frontale' }],
      },
    ],
    steps: [{ id: 'debut', kind: 'debut', mediaPath: 'media/debut.mp4' }],
  })
}

describe('advance — prep-step transitions (GM point-d’accès loop)', () => {
  it('routes the approved verdict to point-acces-valide', () => {
    const config = buildAccessConfig()
    const s = advance(config, createSession(config), 'approved')
    expect(s.currentStepId).toBe('point-acces-valide')
  })

  it('routes the refused verdict to point-acces-refus', () => {
    const config = buildAccessConfig()
    const s = advance(config, createSession(config), 'refused')
    expect(s.currentStepId).toBe('point-acces-refus')
  })

  it('continues from a validated point to choix-approche', () => {
    const config = buildAccessConfig()
    let s = advance(config, createSession(config), 'approved')
    s = advance(config, s, 'continue')
    expect(s.currentStepId).toBe('choix-approche')
  })

  it('retries from a refused point back to point-entree', () => {
    const config = buildAccessConfig()
    let s = advance(config, createSession(config), 'refused')
    s = advance(config, s, 'retry')
    expect(s.currentStepId).toBe('point-entree')
  })

  it('falls through to the linear next when the dispatched event matches no transition', () => {
    const config = buildAccessConfig()
    const s = advance(config, createSession(config))
    expect(s.currentStepId).toBe('point-acces-valide')
  })
})
