import { useCallback, useEffect, useRef, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { GameState, DEFAULT_GAME_STATE } from '@code-rouge/shared-types'
import { randomDeviceId } from '@code-rouge/shared-utils'

// Versioned key — bumping the suffix triggers a clean state on the next
// boot, useful if we ever change the shape of GameState in a non-additive
// way. Today's shape is additive (new fields can default in via Zod) so
// v1 should remain stable through M1.
const STORAGE_KEY = 'code-rouge:game-state:v1'

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
        // restore-by-deviceId depends on this).
        if (next.deviceId === '') {
          next = { ...next, deviceId: randomDeviceId() }
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next))
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

  return { state, setState, ready }
}

export async function clearGameState(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY)
}
