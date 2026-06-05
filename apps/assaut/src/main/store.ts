import { app } from 'electron'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { GameState, DEFAULT_GAME_STATE } from '@code-rouge/shared-types'
import { randomDeviceId } from '@code-rouge/shared-utils'

// Persistence backend: one versioned JSON file under `app.getPath('userData')`.
// Replaces electron-store (v11, ESM-only), which threw « Store is not a constructor »
// in the electron-vite dev main process (ESM/CJS interop) and silently killed
// app:get-game-state restore in dev. A plain typed JSON file is the alternative the
// M1 plan called out (chantier 5.2): it removes the dependency + the dev footgun, and
// writes synchronously so a force-kill right after a transition keeps the last commit
// (immutable rule #4 — persistence is mandatory and crash-safe).

interface StoreFile {
  readonly gameState: GameState
  // Serialized AssautSession blob (engine choices + visit history) for EXACT resume —
  // null until the first transition commits. Opaque to main; the renderer validates
  // its shape on deserialize.
  readonly session: string | null
}

function storePath(): string {
  return join(app.getPath('userData'), 'game-state.v1.json')
}

function readFile(): StoreFile {
  try {
    const parsed: unknown = JSON.parse(readFileSync(storePath(), 'utf8'))
    const obj = (typeof parsed === 'object' && parsed !== null ? parsed : {}) as Record<string, unknown>
    const gs = GameState.safeParse(obj['gameState'])
    if (obj['gameState'] !== undefined && !gs.success) {
      // File exists and parses as JSON but the GameState shape is wrong — reset
      // to default rather than crash every IPC read; log so a dev notices.
      // eslint-disable-next-line no-console
      console.warn('[store] GameState parse failed, resetting to default:', gs.error.message)
    }
    return {
      gameState: gs.success ? gs.data : DEFAULT_GAME_STATE,
      session: typeof obj['session'] === 'string' ? obj['session'] : null,
    }
  } catch {
    // Missing file (first boot) or unreadable — start from defaults.
    return { gameState: DEFAULT_GAME_STATE, session: null }
  }
}

function writeFile(data: StoreFile): void {
  const path = storePath()
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(data), 'utf8')
}

export function readGameState(): GameState {
  const file = readFile()
  let parsed = file.gameState
  // First-boot deviceId minting — persist immediately so subsequent reads return
  // the same id (server-side restore-by-deviceId depends on it).
  if (parsed.deviceId === '') {
    parsed = { ...parsed, deviceId: randomDeviceId() }
    writeFile({ ...file, gameState: parsed })
  }
  return parsed
}

export function writeGameState(next: GameState): void {
  // Preserve the session blob alongside the game-state write.
  writeFile({ ...readFile(), gameState: next })
}

export function readSession(): string | null {
  return readFile().session
}

export function writeSession(blob: string | null): void {
  writeFile({ ...readFile(), session: blob })
}
