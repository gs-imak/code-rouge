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
  // Shortcuts that `globalShortcut.register` declined (Win+L is famous —
  // kernel-intercepted, never registers). Surfacing these explicitly so
  // the M1 demo doesn't silently report the wrong count.
  globalShortcutsFailed: z.array(z.string()),
})
export type KioskStatusResponse = z.infer<typeof KioskStatusResponse>

// Trimmed: only the user-facing app version. `electron` and `platform`
// were information-disclosure surface (fingerprinting Electron CVEs from
// a kiosk renderer) for no UI gain. Reintroduce gated behind
// `app.isPackaged === false` if a dev diagnostic panel needs them.
export const AppVersionResponse = z.object({
  app: z.string(),
})
export type AppVersionResponse = z.infer<typeof AppVersionResponse>

// ----- Bridge surface --------------------------------------------------------
// Exact shape of `window.assaut` injected by the preload script. Keep narrow:
// only what the renderer is allowed to call. Never leak `ipcRenderer` itself.

export interface AssautBridge {
  readonly getKioskStatus: () => Promise<KioskStatusResponse>
  readonly getAppVersion: () => Promise<AppVersionResponse>
}
