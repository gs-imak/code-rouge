// Typed IPC contract between main and renderer processes.
// Per `docs/conventions/assaut.md`: "Zod-validated IPC channels — no untyped
// `ipcRenderer.send`." Schemas live here, both sides import from this file.

import { z } from 'zod'
import { GameState, AssautSequenceConfig } from '@code-rouge/shared-types'

// ----- Channel name registry --------------------------------------------------
// Adding a channel: declare it here, add the request/response schemas below,
// register a handler in main, expose it through the preload bridge.
//
// `KioskStatus` was removed post-M1 validation: it surfaced kiosk internals
// (kiosk:/fullscreen:/shortcut counts) to the renderer with no runtime payoff
// and acted as a small fingerprint surface. Boot-time visibility into
// globalShortcut.register failures is a console.warn in main now (see
// registerKioskShortcuts in apps/assaut/src/main/index.ts).

export const IpcChannel = {
  AppVersion: 'app:version',
  GetGameState: 'app:get-game-state',
  SetGameState: 'app:set-game-state',
  GetSequenceConfig: 'app:get-sequence-config',
} as const
export type IpcChannel = (typeof IpcChannel)[keyof typeof IpcChannel]

// ----- Per-channel schemas ---------------------------------------------------

// Trimmed: only the user-facing app version. `electron` and `platform`
// were information-disclosure surface (fingerprinting Electron CVEs from
// a kiosk renderer) for no UI gain. Reintroduce gated behind
// `app.isPackaged === false` if a dev diagnostic panel needs them.
export const AppVersionResponse = z.object({
  app: z.string(),
})
export type AppVersionResponse = z.infer<typeof AppVersionResponse>

// GameState passes both directions through IPC. The renderer never
// touches the on-disk file directly; main owns electron-store. Validating
// at both ends — main parses what the renderer sends, renderer parses
// what main returns — is paranoid for a same-process channel but cheap.
export { GameState as GetGameStateResponse, GameState as SetGameStateRequest }
export const SetGameStateResponse = z.object({ ok: z.literal(true) })
export type SetGameStateResponse = z.infer<typeof SetGameStateResponse>

// The data-driven Assaut flow, read from disk by main (fs + Zod) and served to
// the renderer. The renderer re-validates with AssautSequenceConfig.parse.
export { AssautSequenceConfig as GetSequenceConfigResponse }

// ----- Bridge surface --------------------------------------------------------
// Exact shape of `window.assaut` injected by the preload script. Keep narrow:
// only what the renderer is allowed to call. Never leak `ipcRenderer` itself.

export interface AssautBridge {
  readonly getAppVersion: () => Promise<AppVersionResponse>
  readonly getGameState: () => Promise<GameState>
  readonly setGameState: (next: GameState) => Promise<SetGameStateResponse>
  /** Load the data-driven Assaut sequence config (read from disk by main). */
  readonly getSequenceConfig: () => Promise<AssautSequenceConfig>
}
