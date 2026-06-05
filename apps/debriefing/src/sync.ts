import { useCallback, useEffect, useRef, useState } from 'react'
import {
  type AppName,
  type GameState,
  type HelloMessage,
  type LogEvent,
  type LogRequestMessage,
  type ServerToAppMessage,
  type TeamsRequestMessage,
} from '@code-rouge/shared-types'
import { createWsClient, type ConnectionState, type WsClient } from '@code-rouge/shared-utils'
import { computeSessionStats, type SessionStats } from './stats/index.js'

// Débriefing server hook: announces the GM device on connect AND drives the
// end-of-session aggregation. On loadStats() it asks the NUC for the session's
// teams (teams-request), then pulls each team's event log (log-request); once
// every team has answered (or a timeout fires) it computes the session stats.
// The NUC is the source of truth — player apps push their logs during/at end of
// play, so a tablet that went offline afterwards doesn't lose its data
// (docs/adr/0002). A team that never answers is reported as "logs missing".

const APP: AppName = 'debriefing'
// Generous: even 12 teams' logs return well under a second on the LAN. The
// timeout only guards against a team that connected but never pushed.
const AGGREGATION_TIMEOUT_MS = 6000

interface Pending {
  expected: Set<number>
  readonly logs: Map<number, readonly LogEvent[]>
  timer: ReturnType<typeof setTimeout> | undefined
}

export interface UseServerHandshakeOptions {
  readonly url: string
  readonly state: GameState
  readonly ready: boolean
}

export interface UseServerHandshakeResult {
  readonly connection: ConnectionState
  readonly stats: SessionStats | null
  readonly loading: boolean
  /** Teams whose log came back empty (never pushed, or offline before completion). */
  readonly missingTeamIds: readonly number[]
  /** Pull every team's log from the NUC and compute the session stats. */
  readonly loadStats: () => void
}

export function useServerHandshake(options: UseServerHandshakeOptions): UseServerHandshakeResult {
  const [connection, setConnection] = useState<ConnectionState>('disconnected')
  const [stats, setStats] = useState<SessionStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [missingTeamIds, setMissingTeamIds] = useState<readonly number[]>([])

  const stateRef = useRef<GameState>(options.state)
  stateRef.current = options.state
  const clientRef = useRef<WsClient | null>(null)
  const pendingRef = useRef<Pending | null>(null)

  const finalize = useCallback(() => {
    const pending = pendingRef.current
    if (pending === null) return
    if (pending.timer !== undefined) clearTimeout(pending.timer)
    // Teams that never answered before the timeout are recorded with an empty
    // log so they surface as "missing" rather than vanishing from the report.
    const logs = new Map(pending.logs)
    for (const teamId of pending.expected) {
      if (!logs.has(teamId)) logs.set(teamId, [])
    }
    const entries = [...logs.entries()].map(([teamId, events]) => ({ teamId, events }))
    setStats(computeSessionStats(entries))
    setMissingTeamIds(entries.filter((e) => e.events.length === 0).map((e) => e.teamId))
    setLoading(false)
    pendingRef.current = null
  }, [])

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
        }
        client.send(hello)
      },
      onMessage: (msg: ServerToAppMessage) => {
        const pending = pendingRef.current
        if (pending === null) return
        if (msg.type === 'teams') {
          if (msg.teams.length === 0) {
            finalize()
            return
          }
          pending.expected = new Set(msg.teams.map((t) => t.teamId))
          const local = stateRef.current
          for (const team of msg.teams) {
            const req: LogRequestMessage = {
              type: 'log-request',
              app: APP,
              deviceId: local.deviceId,
              targetTeamId: team.teamId,
            }
            client.send(req)
          }
          return
        }
        if (msg.type === 'log-result') {
          pending.logs.set(msg.teamId, msg.events)
          pending.expected.delete(msg.teamId)
          if (pending.expected.size === 0) finalize()
        }
      },
    })
    clientRef.current = client
    return () => {
      const pending = pendingRef.current
      if (pending?.timer !== undefined) clearTimeout(pending.timer)
      pendingRef.current = null
      client.disconnect()
      clientRef.current = null
    }
  }, [options.ready, options.url, finalize])

  const loadStats = useCallback(() => {
    const client = clientRef.current
    if (client === null) return
    const prev = pendingRef.current
    if (prev?.timer !== undefined) clearTimeout(prev.timer)
    const timer = setTimeout(() => finalize(), AGGREGATION_TIMEOUT_MS)
    pendingRef.current = { expected: new Set(), logs: new Map(), timer }
    setStats(null)
    setMissingTeamIds([])
    setLoading(true)
    const req: TeamsRequestMessage = {
      type: 'teams-request',
      app: APP,
      deviceId: stateRef.current.deviceId,
    }
    if (!client.send(req)) {
      // Not connected — abort cleanly so the button doesn't hang on "loading".
      clearTimeout(timer)
      pendingRef.current = null
      setLoading(false)
    }
  }, [finalize])

  return { connection, stats, loading, missingTeamIds, loadStats }
}
