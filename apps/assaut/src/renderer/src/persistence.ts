import { useCallback, useEffect, useRef, useState } from 'react'
import { GameState, DEFAULT_GAME_STATE } from '@code-rouge/shared-types'

// The renderer never touches electron-store directly; everything goes
// through the preload bridge (`window.assaut`). On boot, getGameState()
// returns the persisted blob; subsequent setGameState(...) calls round-
// trip through main and write electron-store synchronously.

export interface UseGameStateResult {
  readonly state: GameState
  readonly setState: (next: GameState) => Promise<void>
  readonly ready: boolean
}

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
      .then((value) => {
        if (cancelled) return
        stateRef.current = value
        setStateRaw(value)
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
    const bridge = window.assaut
    if (bridge === undefined) return
    await bridge.setGameState(next)
  }, [])

  return { state, setState, ready }
}
