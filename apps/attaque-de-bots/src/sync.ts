import { useCallback, useEffect, useRef, useState } from 'react'
import {
  reconcile,
  type AppName,
  type GameState,
  type HelloMessage,
  type LogEvent,
  type LogPushMessage,
  type StateUpdateMessage,
} from '@code-rouge/shared-types'
import {
  createWsClient,
  type ConnectionState,
  type WsClient,
} from '@code-rouge/shared-utils'

// Reconnecting WebSocket session manager.
//
// On every render where `state` changes, we DON'T eagerly push to the
// server — that would flood on every keystroke into the team-id input.
// `pushState` is exposed so the caller can fire it after a meaningful
// transition (team validated, step advanced, score changed). Hello +
// reconcile-on-restore happen automatically.

const APP: AppName = 'attaque-de-bots'

export interface UseServerSyncOptions {
  readonly url: string
  readonly state: GameState
  readonly setState: (next: GameState) => Promise<void>
  /**
   * False until the local persistence rehydration completes. The hook
   * waits before sending Hello so the deviceId is the persisted one
   * rather than the empty default.
   */
  readonly ready: boolean
}

export interface UseServerSyncResult {
  readonly connection: ConnectionState
  readonly pushState: () => void
  /**
   * Push the accumulated event log to the NUC. Called once at end of session
   * (immutable rule #5: WS is for low-volume, end-of-session sync). No-op while
   * disconnected or before a team is assigned.
   */
  readonly pushLog: (events: readonly LogEvent[]) => void
  /** Server time at the most recent welcome — useful for clock-drift display. */
  readonly serverTime: number | null
}

export function useServerSync(options: UseServerSyncOptions): UseServerSyncResult {
  const [connection, setConnection] = useState<ConnectionState>('disconnected')
  const [serverTime, setServerTime] = useState<number | null>(null)
  const stateRef = useRef<GameState>(options.state)
  const setStateRef = useRef<UseServerSyncOptions['setState']>(options.setState)
  const clientRef = useRef<WsClient | null>(null)

  // Keep the refs current so callbacks closed over them see the latest.
  stateRef.current = options.state
  setStateRef.current = options.setState

  useEffect(() => {
    if (!options.ready) return undefined
    const client = createWsClient({
      url: options.url,
      onStateChange: setConnection,
      onOpen: () => {
        const local = stateRef.current
        const hello: HelloMessage = {
          type: 'hello',
          app: APP,
          deviceId: local.deviceId,
          teamId: local.teamId,
          ...(local.currentStep !== 'init' ? { lastKnownStep: local.currentStep } : {}),
        }
        client.send(hello)
      },
      onMessage: (msg) => {
        if (msg.type === 'welcome') {
          setServerTime(msg.serverTime)
          return
        }
        if (msg.type === 'restore') {
          const next = reconcile(stateRef.current, msg)
          void setStateRef.current(next)
          return
        }
        // 'cmd' messages handled in chantier 06+ (admin reset, etc.)
      },
    })
    clientRef.current = client
    return () => {
      client.disconnect()
      clientRef.current = null
    }
  }, [options.ready, options.url])

  // Stable across renders (reads live values via refs) so callers can list it in
  // effect deps without re-subscribing every render.
  const pushState = useCallback((): void => {
    const local = stateRef.current
    const client = clientRef.current
    if (client === null || local.teamId === null) return
    const update: StateUpdateMessage = {
      type: 'state',
      app: APP,
      deviceId: local.deviceId,
      teamId: local.teamId,
      step: local.currentStep,
      score: local.score,
      timestamp: Date.now(),
    }
    client.send(update)
  }, [])

  const pushLog = useCallback((events: readonly LogEvent[]): void => {
    const local = stateRef.current
    const client = clientRef.current
    if (client === null || local.teamId === null || events.length === 0) return
    const message: LogPushMessage = {
      type: 'log',
      app: APP,
      deviceId: local.deviceId,
      teamId: local.teamId,
      // Schema caps events at 1000; keep the most recent if somehow over.
      events: events.slice(-1000),
    }
    client.send(message)
  }, [])

  return { connection, pushState, pushLog, serverTime }
}
