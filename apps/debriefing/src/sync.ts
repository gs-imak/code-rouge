import { useCallback, useEffect, useRef, useState } from 'react'
import {
  type AccessDecision,
  type AccessDecisionMessage,
  type AppName,
  type GameState,
  type HelloMessage,
  type LogEvent,
  type LogRequestMessage,
  type McodeSetMessage,
  type ServerToAppMessage,
  type TeamsRequestMessage,
} from '@code-rouge/shared-types'
import { createWsClient, type ConnectionState, type WsClient } from '@code-rouge/shared-utils'
import { computeSessionStats, type SessionStats } from './stats/index.js'

// Débriefing server hook. Two jobs:
//  1. END-OF-SESSION AGGREGATION — on loadStats() ask the NUC for the session's
//     teams (teams-request), pull each team's event log (log-request), and compute
//     stats once all answer (or a timeout fires). The NUC is the source of truth
//     (docs/adr/0002); a team that never answers shows as "logs missing".
//  2. GM CONTROL of the Assaut point-d'accès / MG-code loop — the server forwards
//     each team's `access-submit` here as `access-pending`; the GM rules on it
//     (decideAccess → access-decision) and sets the MG code (setMgCode → mg-code-set).
//     The server relays both to the target team's Assaut app.

const APP: AppName = 'debriefing'
// Generous: even 12 teams' logs return well under a second on the LAN. The
// timeout only guards against a team that connected but never pushed.
const AGGREGATION_TIMEOUT_MS = 6000

interface Pending {
  expected: Set<number>
  readonly logs: Map<number, readonly LogEvent[]>
  timer: ReturnType<typeof setTimeout> | undefined
}

/** A team's entry-point submission awaiting the GM's verdict. */
export interface AccessSubmission {
  readonly teamId: number
  readonly point: string
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
  /** Pending point-d'accès submissions awaiting a GM verdict (latest per team). */
  readonly accessSubmissions: readonly AccessSubmission[]
  /** Rule on a team's submission → relayed to its Assaut app as access-result. */
  readonly decideAccess: (teamId: number, decision: AccessDecision, label?: string) => boolean
  /** Set a team's MG authorisation code → relayed to its Assaut app as mg-code. */
  readonly setMgCode: (teamId: number, code: string) => boolean
}

export function useServerHandshake(options: UseServerHandshakeOptions): UseServerHandshakeResult {
  const [connection, setConnection] = useState<ConnectionState>('disconnected')
  const [stats, setStats] = useState<SessionStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [missingTeamIds, setMissingTeamIds] = useState<readonly number[]>([])
  const [accessSubmissions, setAccessSubmissions] = useState<readonly AccessSubmission[]>([])

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
        // GM-control frame — handled regardless of an in-flight aggregation.
        if (msg.type === 'access-pending') {
          setAccessSubmissions((prev) => [
            // Latest submission per team wins (a re-submit replaces the old one).
            ...prev.filter((s) => s.teamId !== msg.teamId),
            { teamId: msg.teamId, point: msg.point },
          ])
          return
        }
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

  const decideAccess = useCallback(
    (teamId: number, decision: AccessDecision, label?: string): boolean => {
      const client = clientRef.current
      if (client === null) return false
      const msg: AccessDecisionMessage = {
        type: 'access-decision',
        app: APP,
        deviceId: stateRef.current.deviceId,
        targetTeamId: teamId,
        decision,
        ...(label !== undefined ? { label } : {}),
      }
      const ok = client.send(msg)
      // Clear the pending submission once ruled so the GM list doesn't pile up.
      if (ok) setAccessSubmissions((prev) => prev.filter((s) => s.teamId !== teamId))
      return ok
    },
    [],
  )

  const setMgCode = useCallback((teamId: number, code: string): boolean => {
    const client = clientRef.current
    if (client === null) return false
    const msg: McodeSetMessage = {
      type: 'mg-code-set',
      app: APP,
      deviceId: stateRef.current.deviceId,
      targetTeamId: teamId,
      code,
    }
    return client.send(msg)
  }, [])

  return {
    connection,
    stats,
    loading,
    missingTeamIds,
    loadStats,
    accessSubmissions,
    decideAccess,
    setMgCode,
  }
}
