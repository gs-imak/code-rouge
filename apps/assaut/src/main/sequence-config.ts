import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { app } from 'electron'
import { parseAssautSequenceConfig, type AssautSequenceConfig } from '@code-rouge/shared-types'

// Loads the data-driven Assaut flow from disk (immutable rule #2: game content
// is JSON, edited without recompiling). Read once and cached — the file is
// stable for a session. Served to the renderer over the GetSequenceConfig IPC
// channel. A parse failure is fatal by design: refuse to run a malformed flow
// rather than boot into a broken sequence on the venue PC.

function configPath(): string {
  if (app.isPackaged) {
    // electron-builder copies assets/config → resources/config (extraResources).
    return join(process.resourcesPath, 'config', 'sequence.json')
  }
  // Dev: main runs from apps/assaut/out/main/index.js → ../../ = apps/assaut/.
  return join(
    fileURLToPath(new URL('.', import.meta.url)),
    '../../assets/config/sequence.json',
  )
}

let cached: AssautSequenceConfig | null = null

export function readSequenceConfig(): AssautSequenceConfig {
  if (cached !== null) return cached
  const raw = readFileSync(configPath(), 'utf-8')
  cached = parseAssautSequenceConfig(JSON.parse(raw))
  return cached
}
