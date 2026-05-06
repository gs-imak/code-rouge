import { useCallback, useEffect, useRef, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { GameState, DEFAULT_GAME_STATE } from '@code-rouge/shared-types'
import { randomDeviceId } from '@code-rouge/shared-utils'

// See apps/attaque-de-bots/src/persistence.ts for the full rationale.
// This file is byte-near-identical — the duplication is intentional for
// chantier 05 (per the chantier 04 refactoring agent's "extract when 3
// callers" rule). Extract to packages/persistence-rn when a third RN
// app joins the monorepo, OR when the GameState shape diverges per-app.

// App-prefixed, versioned key. See attaque-de-bots' equivalent for the
// rationale (avoiding cross-app state collision when both APKs run on
// the same emulator during dev).
const STORAGE_KEY = 'code-rouge:dbr:game-state:v1'

export interface UseGameStateResult {
  readonly state: GameState
  readonly setState: (next: GameState) => Promise<void>
  readonly getLatest: () => GameState
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
        // See apps/attaque-de-bots/src/persistence.ts for the full
        // rationale: persist failures degrade gracefully into a one-
        // session restore miss rather than crashing the app boot.
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
