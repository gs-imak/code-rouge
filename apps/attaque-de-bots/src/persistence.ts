import { useCallback, useEffect, useRef, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { GameState, DEFAULT_GAME_STATE } from '@code-rouge/shared-types'
import { randomDeviceId } from '@code-rouge/shared-utils'

// App-prefixed, versioned key. The `ats:` infix differentiates from
// debriefing's `dbr:` so that running both APKs on the same emulator
// (a dev convenience) doesn't have them stomp each other's state. The
// `v1` suffix is reserved for non-additive GameState shape changes.
const STORAGE_KEY = 'code-rouge:ats:game-state:v1'

export interface UseGameStateResult {
  /** Latest hydrated state. Default values until `ready` flips true. */
  readonly state: GameState
  /**
   * Replace the persisted state. Resolves once the write to AsyncStorage
   * completes — callers awaiting this can be confident the new value
   * survives a force-kill happening immediately after.
   */
  readonly setState: (next: GameState) => Promise<void>
  /**
   * Synchronous accessor for the latest state. Use this inside event
   * handlers (`onPress`, `onChangeText`) that close over `state` from
   * the render and would otherwise read a stale value when called
   * twice in rapid succession (double-tap, repeated keystroke).
   */
  readonly getLatest: () => GameState
  /**
   * False until the first read from AsyncStorage finishes. Apps gate
   * their first render on this so the player never sees a flash of the
   * default state followed by a swap to the persisted state.
   */
  readonly ready: boolean
}

export function useGameState(): UseGameStateResult {
  const [state, setStateRaw] = useState<GameState>(DEFAULT_GAME_STATE)
  const [ready, setReady] = useState(false)
  const stateRef = useRef<GameState>(DEFAULT_GAME_STATE)

  useEffect(() => {
    let cancelled = false
    AsyncStorage.getItem(STORAGE_KEY)
      .then(async (raw) => {
        if (cancelled) return
        let next: GameState = DEFAULT_GAME_STATE
        if (raw !== null) {
          try {
            next = GameState.parse(JSON.parse(raw))
          } catch {
            // Corrupted blob — fall back to default.
          }
        }
        // Mint a deviceId on the very first boot and persist it so
        // subsequent boots reuse the same identifier (server-side
        // restore-by-deviceId depends on this). If AsyncStorage write
        // fails (storage full, permissions), we run this session with
        // the in-memory id and re-mint on next boot. The acceptable
        // degradation is one session where the server can't restore
        // by deviceId.
        if (next.deviceId === '') {
          next = { ...next, deviceId: randomDeviceId() }
          try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next))
          } catch {
            // intentional: continue without persistence
          }
        }
        stateRef.current = next
        setStateRaw(next)
        setReady(true)
      })
      .catch(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const setState = useCallback(async (next: GameState) => {
    stateRef.current = next
    setStateRaw(next)
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }, [])

  const getLatest = useCallback(() => stateRef.current, [])

  return { state, setState, getLatest, ready }
}

export async function clearGameState(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY)
}
