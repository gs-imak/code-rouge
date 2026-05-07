import { useCallback, useEffect, useRef, useState } from 'react'
import { GameState, DEFAULT_GAME_STATE } from '@code-rouge/shared-types'
import { randomDeviceId } from '@code-rouge/shared-utils'
import type { AssautBridge } from '../../shared/ipc'

// The renderer never touches electron-store directly; everything goes
// through the preload bridge (`window.assaut`). On boot, getGameState()
// returns the persisted blob; subsequent setGameState(...) calls round-
// trip through main and write electron-store synchronously.

export interface UseGameStateResult {
  readonly state: GameState
  readonly setState: (next: GameState) => Promise<void>
  readonly getLatest: () => GameState
  readonly ready: boolean
}

// ----- Pure IPC commit (extracted for unit testing) ---------------------------
//
// The commit path is decoupled from React state so we can exercise the
// optimistic-set + revert-on-rejection contract without standing up a
// renderer. The hook below is a thin wrapper that supplies React-flavored
// `apply` (setStateRaw + stateRef) and a logger.
//
// Contract:
//   1. Apply `next` synchronously (caller's `apply` runs before the
//      bridge call), so the UI shows the new value immediately.
//   2. If `bridge` is undefined, return without throwing — the renderer
//      may legitimately run outside Electron during dev.
//   3. If `bridge.setGameState(next)` rejects, restore `previous` via
//      `apply(previous)` and rethrow so the caller can surface the
//      failure. This is what protects the user from a UI-vs-disk drift
//      where they keep typing into a field that was silently dropped.

export interface CommitGameStateArgs {
  readonly next: GameState
  readonly previous: GameState
  readonly bridge: AssautBridge | undefined
  readonly apply: (state: GameState) => void
  readonly onError?: (err: unknown) => void
}

export async function commitGameState(args: CommitGameStateArgs): Promise<void> {
  args.apply(args.next)
  if (args.bridge === undefined) return
  try {
    await args.bridge.setGameState(args.next)
  } catch (err) {
    // Disk write failed: revert the optimistic local state so the UI
    // doesn't drift from disk. Surface the failure for ops; a real
    // diagnostic UI lands in chantier 06+.
    args.apply(args.previous)
    args.onError?.(err)
    throw err
  }
}

// ----- React hook -------------------------------------------------------------

export function useGameState(): UseGameStateResult {
  const [state, setStateRaw] = useState<GameState>(DEFAULT_GAME_STATE)
  const [ready, setReady] = useState(false)
  const stateRef = useRef<GameState>(DEFAULT_GAME_STATE)

  useEffect(() => {
    let cancelled = false
    const bridge = window.assaut
    if (bridge === undefined) {
      // Bridge missing — preload didn't load. Treat as fresh start.
      setReady(true)
      return
    }
    bridge
      .getGameState()
      .then(async (value) => {
        if (cancelled) return
        let next = value
        // Mint a deviceId on the very first boot and persist it so
        // subsequent boots reuse the same identifier (server-side
        // restore-by-deviceId depends on this; the WS Hello schema
        // also requires a non-empty string). If the persist fails we
        // run this session with the in-memory id and re-mint on next
        // boot — degrades to a one-session restore miss rather than a
        // crashed handshake. Mirrors the same fix applied to the two
        // RN apps in chantier 05 retro.
        if (next.deviceId === '') {
          next = { ...next, deviceId: randomDeviceId() }
          try {
            await bridge.setGameState(next)
          } catch {
            // intentional: continue without persistence
          }
          if (cancelled) return
        }
        stateRef.current = next
        setStateRaw(next)
        setReady(true)
      })
      .catch(() => {
        // IPC failed (main crashed, preload missing). Boot with an
        // ephemeral in-memory deviceId so the WS handshake at least
        // satisfies the schema and the diagnostic dot can light up
        // green; persistence is gone for this session.
        if (cancelled) return
        const ephemeral: GameState = { ...DEFAULT_GAME_STATE, deviceId: randomDeviceId() }
        stateRef.current = ephemeral
        setStateRaw(ephemeral)
        setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const setState = useCallback(async (next: GameState) => {
    const previous = stateRef.current
    await commitGameState({
      next,
      previous,
      bridge: window.assaut,
      apply: (value) => {
        stateRef.current = value
        setStateRaw(value)
      },
      onError: (err) => {
        // eslint-disable-next-line no-console
        console.error('[persistence] setGameState IPC rejected:', err)
      },
    })
  }, [])

  const getLatest = useCallback(() => stateRef.current, [])

  return { state, setState, getLatest, ready }
}
