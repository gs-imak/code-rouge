import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  AccessDecision,
  AccessSubmitMessage,
  AppName,
  GameState,
  HelloMessage,
  RestoreMessage,
  ServerToAppMessage,
  StateUpdateMessage,
} from '@code-rouge/shared-types'
import { createWsClient, type ConnectionState, type WsClient } from '@code-rouge/shared-utils'

// Reconnecting WS client for the Electron renderer. Beyond the M1 hello handshake
// it now (M2) PUSHES the live game state to the NUC on every transition and CONSUMES
// the GM-mediated frames: `access-result` drives the Validation/Refus screens and
// `mg-code` fills the « attente code MG » screen. All low-volume + GM-mediated, so
// within the WS remit (immutable rule #5). The point-d'accès / MG-code loops are
// E2E only once the Débriefing (GM) app sends the verdicts; the consumer + the pure
// routing below are unit-tested against mocked frames (sync.test.ts).
//
// CSP `connect-src ws: wss:` (renderer/index.html) + `webSecurity: true` allow the
// connection out the renderer side.

const APP: AppName = 'assaut'

/** Pure: build the state-push frame from the current GameState. */
export function buildStateUpdate(state: GameState, now: number): StateUpdateMessage {
  return {
    type: 'state',
    app: APP,
    deviceId: state.deviceId,
    teamId: state.teamId,
    step: state.currentStep,
    // Score floor matches the schema; a negative would be rejected server-side.
    score: Math.max(0, state.score),
    timestamp: now,
  }
}

export interface ServerFrameHandlers {
  readonly onAccessResult?: ((decision: AccessDecision, label?: string) => void) | undefined
  readonly onMgCode?: ((code: string) => void) | undefined
  readonly onRestore?: ((msg: RestoreMessage) => void) | undefined
}

/**
 * Pure: route an inbound server frame to its handler. Frames Assaut doesn't
 * consume (welcome / cmd / teams / log-result) are ignored. Extracted from the
 * hook so the routing is unit-testable without a socket.
 */
export function dispatchServerMessage(msg: ServerToAppMessage, handlers: ServerFrameHandlers): void {
  switch (msg.type) {
    case 'access-result':
      handlers.onAccessResult?.(msg.decision, msg.label)
      break
    case 'mg-code':
      handlers.onMgCode?.(msg.code)
      break
    case 'restore':
      handlers.onRestore?.(msg)
      break
    default:
      break
  }
}

export interface UseServerHandshakeOptions {
  readonly url: string
  readonly state: GameState
  readonly ready: boolean
  readonly onAccessResult?: (decision: AccessDecision, label?: string) => void
  readonly onMgCode?: (code: string) => void
  readonly onRestore?: (msg: RestoreMessage) => void
}

export interface UseServerHandshakeResult {
  readonly connection: ConnectionState
  /** Submit an entry point for GM approval (point-d'accès loop); false if not connected. */
  readonly submitAccessPoint: (point: string) => boolean
}

export function useServerHandshake(options: UseServerHandshakeOptions): UseServerHandshakeResult {
  const [connection, setConnection] = useState<ConnectionState>('disconnected')
  const stateRef = useRef<GameState>(options.state)
  stateRef.current = options.state
  const clientRef = useRef<WsClient | null>(null)
  // Latest handlers in a ref so the socket's onMessage always calls current
  // closures without re-opening the connection on every render.
  const handlersRef = useRef<ServerFrameHandlers>({})
  handlersRef.current = {
    onAccessResult: options.onAccessResult,
    onMgCode: options.onMgCode,
    onRestore: options.onRestore,
  }

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
        // Reconnection hint: lets the server decide whether to send a restore.
        client.send(local.currentStep !== 'init' ? { ...hello, lastKnownStep: local.currentStep } : hello)
      },
      onMessage: (msg) => dispatchServerMessage(msg, handlersRef.current),
    })
    clientRef.current = client
    return () => {
      clientRef.current = null
      client.disconnect()
    }
  }, [options.ready, options.url])

  // Push the live state to the NUC whenever the synced fields change and we're
  // connected (the server upserts team_state by (team, app)). One frame per
  // transition. Skipped before a deviceId is minted (the schema requires one).
  useEffect(() => {
    if (connection !== 'connected') return
    const local = stateRef.current
    if (local.deviceId === '') return
    clientRef.current?.send(buildStateUpdate(local, Date.now()))
  }, [connection, options.state.currentStep, options.state.score, options.state.teamId])

  const submitAccessPoint = useCallback((point: string): boolean => {
    const local = stateRef.current
    const msg: AccessSubmitMessage = {
      type: 'access-submit',
      app: APP,
      deviceId: local.deviceId,
      teamId: local.teamId,
      point,
    }
    return clientRef.current?.send(msg) ?? false
  }, [])

  return { connection, submitAccessPoint }
}
