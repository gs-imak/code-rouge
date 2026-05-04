import { useEffect, useRef, useState } from 'react'
import type { AppName, GameState, HelloMessage } from '@code-rouge/shared-types'
import { createWsClient, type ConnectionState } from '@code-rouge/shared-utils'

// Reconnecting WS handshake for the Electron renderer. Same shape as
// debriefing's hook — assaut is M1-listener (no state push yet); the
// dot in the kiosk-status footer renders the connection state.
//
// CSP `connect-src ws: wss:` (renderer/index.html) and `webSecurity:
// true` (main/index.ts BrowserWindow) allow the connection out the
// renderer side. The bundle ships `ws://127.0.0.1:8080/ws` as the dev
// default; chantier 06+ admin screen lets the GM override at runtime.

const APP: AppName = 'assaut'

export interface UseServerHandshakeOptions {
  readonly url: string
  readonly state: GameState
  readonly ready: boolean
}

export interface UseServerHandshakeResult {
  readonly connection: ConnectionState
}

export function useServerHandshake(options: UseServerHandshakeOptions): UseServerHandshakeResult {
  const [connection, setConnection] = useState<ConnectionState>('disconnected')
  const stateRef = useRef<GameState>(options.state)
  stateRef.current = options.state

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
    })
    return () => {
      client.disconnect()
    }
  }, [options.ready, options.url])

  return { connection }
}
