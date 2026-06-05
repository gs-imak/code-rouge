import { describe, expect, it } from 'vitest'
import {
  DEFAULT_GAME_STATE,
  parseAssautSequenceConfig,
  type AssautSequenceConfig,
  type GameState,
} from '@code-rouge/shared-types'
import { advance, applyChoice, createSession, serializeSession } from './assaut-sequence'
import { initialSession, projectToGameState, restoreSession } from './session-bridge'

function buildConfig(): AssautSequenceConfig {
  return parseAssautSequenceConfig({
    schemaVersion: 1,
    scoring: { startPercent: 50 },
    prep: [
      {
        id: 'approche',
        kind: 'choix-approche',
        choices: [{ id: 'frontale', label: 'Approche frontale', dataRecoveredDelta: 10 }],
      },
    ],
    steps: [
      { id: 'debut', kind: 'debut', mediaPath: 'media/debut.mp4' },
      { id: 'patrouille', kind: 'patrouille', mediaPath: 'media/patrouille.mp4' },
      { id: 'epilogue', kind: 'epilogue', mediaPath: 'media/epilogue.mp4' },
    ],
  })
}

describe('restoreSession', () => {
  it('creates a fresh session when GameState carries no real progress', () => {
    const config = buildConfig()
    // DEFAULT_GAME_STATE.currentStep is 'init', which is not a step in the flow.
    expect(restoreSession(config, DEFAULT_GAME_STATE)).toEqual(createSession(config))
  })

  it('repositions at the persisted step with the persisted score', () => {
    const config = buildConfig()
    const gs: GameState = { ...DEFAULT_GAME_STATE, currentStep: 'patrouille', score: 40 }
    const s = restoreSession(config, gs)
    expect(s.currentStepId).toBe('patrouille')
    expect(s.phase).toBe('assault')
    expect(s.dataRecoveredPercent).toBe(40)
  })

  it('falls back to a fresh session when the persisted step is unknown', () => {
    const config = buildConfig()
    const gs: GameState = { ...DEFAULT_GAME_STATE, currentStep: 'mystery', score: 10 }
    expect(restoreSession(config, gs)).toEqual(createSession(config))
  })

  it('clamps an out-of-range persisted score', () => {
    const config = buildConfig()
    const gs: GameState = { ...DEFAULT_GAME_STATE, currentStep: 'debut', score: 250 }
    expect(restoreSession(config, gs).dataRecoveredPercent).toBe(100)
  })
})

describe('projectToGameState', () => {
  it('maps currentStepId and score onto GameState, preserving other fields', () => {
    const config = buildConfig()
    const session = applyChoice(config, createSession(config), 'frontale') // at debut, score 60
    const prev: GameState = { ...DEFAULT_GAME_STATE, deviceId: 'dev-1', serverIp: '10.0.0.5' }
    const gs = projectToGameState(session, prev)
    expect(gs.currentStep).toBe('debut')
    expect(gs.score).toBe(60)
    expect(gs.deviceId).toBe('dev-1')
    expect(gs.serverIp).toBe('10.0.0.5')
  })

  it('uses the last visited step once the session is complete', () => {
    const config = buildConfig()
    let s = applyChoice(config, createSession(config), 'frontale') // → debut
    s = advance(config, s) // debut → patrouille
    s = advance(config, s) // patrouille → epilogue
    s = advance(config, s) // epilogue → complete
    const gs = projectToGameState(s, DEFAULT_GAME_STATE)
    expect(gs.currentStep).toBe('epilogue')
  })
})

describe('initialSession', () => {
  it('restores the exact session (choices + visited) from a valid blob', () => {
    const config = buildConfig()
    const played = applyChoice(config, createSession(config), 'frontale') // choice recorded, → debut
    const blob = serializeSession(played)
    // GameState carries no progress — only the blob does.
    expect(initialSession(config, blob, DEFAULT_GAME_STATE)).toEqual(played)
    // The blob is the source of truth for choices/visited that GameState can't carry.
    expect(initialSession(config, blob, DEFAULT_GAME_STATE).choices).toEqual({ approche: 'frontale' })
  })

  it('restores a completed session (currentStepId null) from a blob', () => {
    const config = buildConfig()
    let s = applyChoice(config, createSession(config), 'frontale')
    s = advance(config, s) // debut → patrouille
    s = advance(config, s) // patrouille → epilogue
    s = advance(config, s) // epilogue → complete
    expect(s.currentStepId).toBeNull()
    expect(initialSession(config, serializeSession(s), DEFAULT_GAME_STATE)).toEqual(s)
  })

  it('falls back to the GameState reposition when the blob is null', () => {
    const config = buildConfig()
    const gs: GameState = { ...DEFAULT_GAME_STATE, currentStep: 'patrouille', score: 40 }
    expect(initialSession(config, null, gs)).toEqual(restoreSession(config, gs))
  })

  it('falls back when the blob is corrupt', () => {
    const config = buildConfig()
    const gs: GameState = { ...DEFAULT_GAME_STATE, currentStep: 'debut', score: 20 }
    expect(initialSession(config, '{ not json', gs)).toEqual(restoreSession(config, gs))
  })

  it('falls back when the blob references a step absent from the config', () => {
    const config = buildConfig()
    // A valid-shaped session whose step no longer exists (config edited between runs).
    const orphan = serializeSession({
      phase: 'assault',
      currentStepId: 'ghost-step',
      choices: {},
      dataRecoveredPercent: 30,
      visited: ['ghost-step'],
    })
    expect(initialSession(config, orphan, DEFAULT_GAME_STATE)).toEqual(createSession(config))
  })
})
