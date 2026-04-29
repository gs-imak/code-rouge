// Typed IPC contract between main and renderer processes.
// Per `.claude/rules/assaut.md`: "Zod-validated IPC channels — no untyped
// `ipcRenderer.send`." Schemas live here, both sides import from this file.

import { z } from 'zod'

// ----- Channel name registry --------------------------------------------------
// Adding a channel: declare it here, add the request/response schemas below,
// register a handler in main, expose it through the preload bridge.

export const IpcChannel = {
  KioskStatus: 'app:kiosk-status',
  AppVersion: 'app:version',
} as const
export type IpcChannel = (typeof IpcChannel)[keyof typeof IpcChannel]

// ----- Per-channel schemas ---------------------------------------------------

export const KioskStatusResponse = z.object({
  fullscreen: z.boolean(),
  kiosk: z.boolean(),
  globalShortcutsRegistered: z.array(z.string()),
})
export type KioskStatusResponse = z.infer<typeof KioskStatusResponse>

export const AppVersionResponse = z.object({
  electron: z.string(),
  app: z.string(),
  platform: z.string(),
})
export type AppVersionResponse = z.infer<typeof AppVersionResponse>

// ----- Bridge surface --------------------------------------------------------
// Exact shape of `window.assaut` injected by the preload script. Keep narrow:
// only what the renderer is allowed to call. Never leak `ipcRenderer` itself.

export interface AssautBridge {
  readonly getKioskStatus: () => Promise<KioskStatusResponse>
  readonly getAppVersion: () => Promise<AppVersionResponse>
}
