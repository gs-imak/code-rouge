import { describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_GAME_STATE,
  parseAssautSequenceConfig,
  type GameState,
} from '@code-rouge/shared-types'
import sequence from '../../../assets/config/sequence.json' with { type: 'json' }
import { commitGameState } from './persistence'
import type { AssautBridge, SetGameStateResponse } from '../../shared/ipc'

// The renderer's persistence hook lives over a React render loop, but
// the only behavior we care about for regression catching is the
// optimistic-set + revert-on-rejection contract. That logic was extracted
// into `commitGameState` so we can test it without standing up React,
// happy-dom, and @testing-library/react (which would force a workspace-
// wide React-version dedupe to deal with pnpm's hoisting). The hook
// itself is a thin wrapper around `commitGameState` and React's
// useState/useRef; if those primitives behave as documented, the
// contract holds.

const OK: SetGameStateResponse = { ok: true }

function makeBridge(setGameStateImpl: AssautBridge['setGameState']): AssautBridge {
  return {
    getGameState: vi.fn(async () => DEFAULT_GAME_STATE as GameState),
    setGameState: setGameStateImpl,
    getAppVersion: vi.fn(async () => ({ app: '0.0.0' })),
    getSequenceConfig: vi.fn(async () => parseAssautSequenceConfig(sequence)),
  }
}

describe('commitGameState — happy path', () => {
  it('applies `next` synchronously, then awaits bridge.setGameState', async () => {
    const bridge = makeBridge(vi.fn(async () => OK))
    const apply = vi.fn((_: GameState): void => {})
    const next: GameState = { ...DEFAULT_GAME_STATE, draftAuthCode: 'a' }

    await commitGameState({ next, previous: DEFAULT_GAME_STATE, bridge, apply })

    expect(apply).toHaveBeenCalledTimes(1)
    expect(apply).toHaveBeenCalledWith(next)
    expect(bridge.setGameState).toHaveBeenCalledWith(next)
  })

  it('does not call setGameState when no bridge is present (renderer outside Electron)', async () => {
    const apply = vi.fn((_: GameState): void => {})
    const next: GameState = { ...DEFAULT_GAME_STATE, draftAuthCode: 'no-bridge' }

    await commitGameState({ next, previous: DEFAULT_GAME_STATE, bridge: undefined, apply })

    expect(apply).toHaveBeenCalledWith(next)
    expect(apply).toHaveBeenCalledTimes(1)
  })
})

describe('commitGameState — failure path (the regression we care about)', () => {
  it('REVERTS by calling apply(previous) when bridge.setGameState rejects', async () => {
    const ipcError = new Error('SetGameState: invalid payload — score must be non-negative')
    const bridge = makeBridge(vi.fn(async () => Promise.reject(ipcError)))
    const apply = vi.fn((_: GameState): void => {})
    const previous: GameState = { ...DEFAULT_GAME_STATE, draftAuthCode: 'previous' }
    const next: GameState = { ...DEFAULT_GAME_STATE, draftAuthCode: 'will-be-rejected' }

    await expect(
      commitGameState({ next, previous, bridge, apply }),
    ).rejects.toBe(ipcError)

    // The crucial sequence: optimistic-apply happens first, then the
    // revert-apply lands `previous`. A handler closing over the React
    // state via getLatest() must observe `previous` after this rejection,
    // not the dropped `next`. We assert order explicitly because a
    // reversal would be a silent UI-vs-disk drift bug.
    expect(apply).toHaveBeenCalledTimes(2)
    expect(apply.mock.calls[0]?.[0]).toBe(next)
    expect(apply.mock.calls[1]?.[0]).toBe(previous)
  })

  it('rethrows the IPC error so the caller can log/surface it', async () => {
    const ipcError = new Error('write EIO')
    const bridge = makeBridge(vi.fn(async () => Promise.reject(ipcError)))

    await expect(
      commitGameState({
        next: DEFAULT_GAME_STATE,
        previous: DEFAULT_GAME_STATE,
        bridge,
        apply: () => {},
      }),
    ).rejects.toBe(ipcError)
  })

  it('invokes onError exactly once with the rejection reason before rethrowing', async () => {
    const ipcError = new Error('disk full')
    const bridge = makeBridge(vi.fn(async () => Promise.reject(ipcError)))
    const onError = vi.fn((_: unknown): void => {})

    await expect(
      commitGameState({
        next: DEFAULT_GAME_STATE,
        previous: DEFAULT_GAME_STATE,
        bridge,
        apply: () => {},
        onError,
      }),
    ).rejects.toBe(ipcError)

    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith(ipcError)
  })

  it('does not invoke onError on the happy path', async () => {
    const bridge = makeBridge(vi.fn(async () => OK))
    const onError = vi.fn((_: unknown): void => {})

    await commitGameState({
      next: DEFAULT_GAME_STATE,
      previous: DEFAULT_GAME_STATE,
      bridge,
      apply: () => {},
      onError,
    })

    expect(onError).not.toHaveBeenCalled()
  })
})
