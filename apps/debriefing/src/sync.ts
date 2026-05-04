import { useEffect, useRef, useState } from 'react'
import type { AppName, GameState, HelloMessage } from '@code-rouge/shared-types'
import { createWsClient, type ConnectionState } from '@code-rouge/shared-utils'

// Lighter wrapper than attaque-de-bots' useServerSync — debriefing is a
// listener app for M1 (it neither pushes state updates nor reconciles
// restore). This hook just announces the device on connect and surfaces
// the connection state so the diagnostic dot can render.

const APP: AppName = 'debriefing'

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
  // Hold the latest state in a ref so the effect only re-runs on
  // url/ready changes — re-running on every state mutation would tear
  // down + reopen the WS connection on each keystroke into the GM input.
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
