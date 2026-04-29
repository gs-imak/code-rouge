import Store from 'electron-store'
import { GameState, DEFAULT_GAME_STATE } from '@code-rouge/shared-types'
import { randomDeviceId } from '@code-rouge/shared-utils'

// electron-store persists JSON under `app.getPath('userData')` by default.
// We use a versioned filename so a future incompatible shape change can
// switch the file rather than migrating the existing one in place.

interface StoreSchema {
  gameState: GameState
}

let storeInstance: Store<StoreSchema> | null = null

function store(): Store<StoreSchema> {
  if (storeInstance === null) {
    storeInstance = new Store<StoreSchema>({
      name: 'game-state.v1',
      defaults: { gameState: DEFAULT_GAME_STATE },
      // electron-store also supports schema validation via ajv. We Zod-
      // parse on read instead because the schema lives in shared-types
      // (single source of truth) — duplicating it here as JSON Schema
      // would invite drift.
    })
  }
  return storeInstance
}

export function readGameState(): GameState {
  const raw = store().get('gameState', DEFAULT_GAME_STATE)
  const result = GameState.safeParse(raw)
  let parsed: GameState
  if (!result.success) {
    // On-disk shape doesn't match — reset to default rather than crash
    // the renderer with a Zod error on every IPC call. Log the corruption
    // so a developer notices.
    // eslint-disable-next-line no-console
    console.warn('[store] GameState parse failed, resetting to default:', result.error.message)
    parsed = DEFAULT_GAME_STATE
  } else {
    parsed = result.data
  }
  // First-boot deviceId minting — same pattern as the RN persistence
  // hooks. Persists immediately so subsequent reads return the same id.
  if (parsed.deviceId === '') {
    parsed = { ...parsed, deviceId: randomDeviceId() }
    store().set('gameState', parsed)
  }
  return parsed
}

export function writeGameState(next: GameState): void {
  // The IPC handler already Zod-validates the inbound payload; this
  // accepts a typed value and writes synchronously (electron-store is
  // sync on disk).
  store().set('gameState', next)
}
