import { describe, expect, it, vi } from 'vitest'
import {
  AppToServerMessage,
  DEFAULT_GAME_STATE,
  type RestoreMessage,
  type ServerToAppMessage,
} from '@code-rouge/shared-types'
import { buildStateUpdate, dispatchServerMessage } from './sync'

describe('buildStateUpdate', () => {
  it('builds a schema-valid state frame from GameState', () => {
    const state = { ...DEFAULT_GAME_STATE, deviceId: 'dev-1', teamId: 7, currentStep: 'debut', score: 42 }
    const msg = buildStateUpdate(state, 1000)
    expect(msg).toEqual({
      type: 'state',
      app: 'assaut',
      deviceId: 'dev-1',
      teamId: 7,
      step: 'debut',
      score: 42,
      timestamp: 1000,
    })
    // Must satisfy the wire schema so the server accepts it.
    expect(AppToServerMessage.safeParse(msg).success).toBe(true)
  })

  it('floors a negative score to 0 (schema requires non-negative)', () => {
    const state = { ...DEFAULT_GAME_STATE, deviceId: 'dev-1', score: -5, currentStep: 'debut' }
    expect(buildStateUpdate(state, 0).score).toBe(0)
  })
})

describe('dispatchServerMessage', () => {
  it('routes access-result to onAccessResult with decision + label', () => {
    const onAccessResult = vi.fn()
    const msg: ServerToAppMessage = { type: 'access-result', decision: 'approved', label: 'Toits' }
    dispatchServerMessage(msg, { onAccessResult })
    expect(onAccessResult).toHaveBeenCalledWith('approved', 'Toits')
  })

  it('routes a refusal', () => {
    const onAccessResult = vi.fn()
    dispatchServerMessage({ type: 'access-result', decision: 'refused' }, { onAccessResult })
    expect(onAccessResult).toHaveBeenCalledWith('refused', undefined)
  })

  it('routes mg-code to onMgCode', () => {
    const onMgCode = vi.fn()
    dispatchServerMessage({ type: 'mg-code', code: 'SECTION13' }, { onMgCode })
    expect(onMgCode).toHaveBeenCalledWith('SECTION13')
  })

  it('routes restore to onRestore', () => {
    const onRestore = vi.fn()
    const msg: RestoreMessage = { type: 'restore', teamId: 3, app: 'assaut', step: 'patrouille', score: 30, timestamp: 9 }
    dispatchServerMessage(msg, { onRestore })
    expect(onRestore).toHaveBeenCalledWith(msg)
  })

  it('ignores frames Assaut does not consume', () => {
    const handlers = { onAccessResult: vi.fn(), onMgCode: vi.fn(), onRestore: vi.fn() }
    dispatchServerMessage({ type: 'cmd', cmd: 'ping' }, handlers)
    dispatchServerMessage({ type: 'welcome', teamId: 1, sessionId: 's', serverTime: 0 }, handlers)
    expect(handlers.onAccessResult).not.toHaveBeenCalled()
    expect(handlers.onMgCode).not.toHaveBeenCalled()
    expect(handlers.onRestore).not.toHaveBeenCalled()
  })

  it('does not throw when the matching handler is absent', () => {
    expect(() => dispatchServerMessage({ type: 'mg-code', code: 'x' }, {})).not.toThrow()
  })
})
