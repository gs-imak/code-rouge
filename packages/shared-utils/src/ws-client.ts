// Reconnecting WebSocket client used by all three apps (assaut renderer,
// attaque-de-bots RN, debriefing RN). Uses the standard `WebSocket`
// global which exists in browsers, RN, and Electron renderers.
//
// Design:
//   - `connect()` opens the socket and starts the reconnect loop on close.
//   - On open, fires `onOpen` so the app can send Hello.
//   - Inbound text frames are parsed via `parseServerToAppMessage` and
//     handed to `onMessage`. Frames that fail Zod validation are dropped
//     with a console.warn — never crash the app.
//   - On close, schedules the next attempt via `nextBackoffDelay`.
//   - `disconnect()` halts the reconnect loop and closes cleanly.
//
// Runtime constraints:
//   - No Node-only APIs (no `import { WebSocket } from 'ws'`).
//   - No top-level side effects on import.

import {
  parseServerToAppMessage,
  MessageParseError,
  type AppToServerMessage,
  type ServerToAppMessage,
} from '@code-rouge/shared-types'
import { nextBackoffDelay, type BackoffOptions } from './backoff.js'

export type ConnectionState = 'disconnected' | 'connecting' | 'connected'

export interface WsClientOptions {
  readonly url: string
  readonly onOpen?: (() => void) | undefined
  readonly onMessage?: ((msg: ServerToAppMessage) => void) | undefined
  readonly onStateChange?: ((state: ConnectionState) => void) | undefined
  readonly onError?: ((err: unknown) => void) | undefined
  readonly backoff?: BackoffOptions | undefined
  /**
   * Default `globalThis.WebSocket`. Pass an alternate constructor for tests.
   */
  readonly WebSocketCtor?: typeof WebSocket | undefined
}

export interface WsClient {
  readonly state: () => ConnectionState
  readonly send: (msg: AppToServerMessage) => boolean
  readonly disconnect: () => void
}

export function createWsClient(options: WsClientOptions): WsClient {
  const Ctor = options.WebSocketCtor ?? globalThis.WebSocket
  if (Ctor === undefined) {
    throw new Error('WebSocket constructor not available in this environment')
  }

  let ws: WebSocket | null = null
  let state: ConnectionState = 'disconnected'
  let attempt = 0
  let stopped = false
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined

  function setState(next: ConnectionState): void {
    if (state === next) return
    state = next
    options.onStateChange?.(next)
  }

  function scheduleReconnect(): void {
    if (stopped) return
    const delay = nextBackoffDelay(attempt, options.backoff)
    attempt += 1
    reconnectTimer = setTimeout(connect, delay)
  }

  function connect(): void {
    if (stopped) return
    setState('connecting')
    let socket: WebSocket
    try {
      socket = new Ctor(options.url)
    } catch (err) {
      options.onError?.(err)
      scheduleReconnect()
      return
    }
    ws = socket

    // Use property setters rather than addEventListener — the
    // overloaded `addEventListener` on the cross-runtime `WebSocket`
    // surface has subtly different signatures across DOM lib types and
    // RN's polyfilled global. The `on*` properties are uniformly typed.
    socket.onopen = () => {
      attempt = 0
      setState('connected')
      options.onOpen?.()
    }

    socket.onmessage = (event: { data?: unknown }) => {
      // `data` is optional on RN's WebSocketMessageEvent type but always
      // present in practice. Be defensive — bail on the no-data case.
      const data = typeof event.data === 'string' ? event.data : null
      if (data === null) {
        // Binary frame — protocol is text-only.
        return
      }
      try {
        const msg = parseServerToAppMessage(data)
        options.onMessage?.(msg)
      } catch (err) {
        if (err instanceof MessageParseError) {
          options.onError?.(err)
        } else {
          options.onError?.(err)
        }
      }
    }

    socket.onclose = () => {
      ws = null
      if (stopped) {
        setState('disconnected')
        return
      }
      setState('disconnected')
      scheduleReconnect()
    }

    socket.onerror = (event: unknown) => {
      options.onError?.(event)
      // Don't tear down here — the close event fires next and the
      // reconnect loop handles it.
    }
  }

  connect()

  return {
    state: () => state,
    send: (msg) => {
      if (ws === null || ws.readyState !== Ctor.OPEN) return false
      try {
        ws.send(JSON.stringify(msg))
        return true
      } catch (err) {
        options.onError?.(err)
        return false
      }
    },
    disconnect: () => {
      stopped = true
      if (reconnectTimer !== undefined) clearTimeout(reconnectTimer)
      ws?.close(1000, 'client disconnect')
      setState('disconnected')
    },
  }
}
