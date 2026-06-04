import { useCallback, useEffect, useRef, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { GameState, LogEvent, ParcoursConfig } from '@code-rouge/shared-types'
import {
  createFlow,
  currentView,
  deserializeFlow,
  dispatch as engineDispatch,
  isComplete,
  serializeFlow,
  type FlowEvent,
  type FlowState,
  type FlowView,
} from '../engine/bots-flow'
import { projectToGameState } from '../engine/flow-session-bridge'

// React binding for the pure flow engine. Owns the serialised flow session
// (exact restore on boot — immutable rule #4), projects each transition onto
// the synced GameState, and pushes the event log to the NUC at end of session.
// The engine stays pure; this is the glue.

// Versioned, app-prefixed (ats:) — distinct from the GameState key + debriefing.
const FLOW_KEY = 'code-rouge:ats:flow-session:v1'

export interface UseFlowOptions {
  readonly config: ParcoursConfig
  /** True once local GameState rehydration has completed (gates flow restore). */
  readonly ready: boolean
  /** Synchronous accessor for the latest GameState (avoids stale closures). */
  readonly getGameState: () => GameState
  readonly setGameState: (next: GameState) => Promise<void>
  /** Push the end-of-session event log to the NUC. */
  readonly pushLog: (events: readonly LogEvent[]) => void
}

export interface UseFlowResult {
  readonly flow: FlowState
  readonly view: FlowView
  /** True once the flow session has rehydrated (gate the first render on this). */
  readonly ready: boolean
  readonly dispatch: (event: FlowEvent) => void
  /** Connexion: commit the team id to GameState, then advance past connexion. */
  readonly submitTeam: (code: string) => void
}

export function useFlow(options: UseFlowOptions): UseFlowResult {
  const { config } = options
  const [flow, setFlow] = useState<FlowState>(() => createFlow(config))
  const [flowReady, setFlowReady] = useState(false)
  const flowRef = useRef(flow)
  flowRef.current = flow

  // Keep the latest option callbacks behind a ref so `dispatch` stays stable.
  const optsRef = useRef(options)
  optsRef.current = options

  // Rehydrate the flow session once local GameState is ready. A corrupt or
  // version-skewed blob falls back to a fresh flow rather than crashing.
  useEffect(() => {
    if (!options.ready) return undefined
    let cancelled = false
    AsyncStorage.getItem(FLOW_KEY)
      .then((raw) => {
        if (cancelled) return
        let next = createFlow(config)
        if (raw !== null) {
          try {
            next = deserializeFlow(raw)
          } catch {
            // corrupt blob — start fresh
          }
        }
        flowRef.current = next
        setFlow(next)
        setFlowReady(true)
      })
      .catch(() => {
        if (!cancelled) setFlowReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [options.ready, config])

  const dispatch = useCallback(
    (event: FlowEvent) => {
      const prev = flowRef.current
      let next: FlowState
      try {
        next = engineDispatch(config, prev, event, Date.now())
      } catch {
        // Defensive: an out-of-phase event (shouldn't happen via the registry).
        return
      }
      if (next === prev) return // no-op transition (terminal CONTINUE, idle BACK)
      flowRef.current = next
      setFlow(next)
      AsyncStorage.setItem(FLOW_KEY, serializeFlow(next)).catch(() => {})
      // Project onto GameState (currentStep + score) so the server sync + restore
      // see progress; persistence happens inside setGameState.
      const projected = projectToGameState(config, next, optsRef.current.getGameState())
      void optsRef.current.setGameState(projected)
      // End-of-session: push the event log once, on the transition into 'fin'.
      if (isComplete(next) && !isComplete(prev) && next.log.length > 0) {
        optsRef.current.pushLog(next.log)
      }
    },
    [config],
  )

  const submitTeam = useCallback(
    (code: string) => {
      // Strict: the connexion code must be all digits (parseInt would accept
      // "7abc" → 7). Empty / non-numeric input is ignored.
      const trimmed = code.trim()
      if (!/^\d+$/.test(trimmed)) return
      const teamId = Number.parseInt(trimmed, 10)
      if (!Number.isInteger(teamId) || teamId < 0) return
      const base = optsRef.current.getGameState()
      // Commit teamId first (synchronously updates the persistence ref) so the
      // CONTINUE below projects a GameState that already carries it.
      void optsRef.current.setGameState({ ...base, teamId, lastSync: Date.now() })
      dispatch({ type: 'CONTINUE' })
    },
    [dispatch],
  )

  return { flow, view: currentView(config, flow), ready: flowReady, dispatch, submitTeam }
}

/** Wipe the persisted flow session (admin reset / new game). */
export async function clearFlowSession(): Promise<void> {
  await AsyncStorage.removeItem(FLOW_KEY)
}
