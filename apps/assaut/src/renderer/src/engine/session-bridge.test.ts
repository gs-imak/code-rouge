import { describe, expect, it } from 'vitest'
import {
  DEFAULT_GAME_STATE,
  parseAssautSequenceConfig,
  type AssautSequenceConfig,
  type GameState,
} from '@code-rouge/shared-types'
import { advance, applyChoice, createSession } from './assaut-sequence'
import { projectToGameState, restoreSession } from './session-bridge'

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
