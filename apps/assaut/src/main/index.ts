import { app, BrowserWindow, globalShortcut, ipcMain } from 'electron'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  IpcChannel,
  AppVersionResponse,
  SetGameStateResponse,
} from '../shared/ipc.js'
import { GameState } from '@code-rouge/shared-types'
import { readGameState, writeGameState } from './store.js'

// ----- Single-instance lock — must be acquired before whenReady() -----------
//
// If a second copy is launched, focus the existing window and quit the
// duplicate. Acquiring the lock at module load (rather than inside
// app.whenReady()) closes the race where a second instance could spawn
// during the ~200ms between process start and the whenReady promise.
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
}

// ----- Kiosk lock — triple verrou per .claude/rules/assaut.md ----------------
//
// 1. BrowserWindow: kiosk + fullscreen + frame:false
//    NB: `alwaysOnTop` is intentionally absent. On Windows, `kiosk:true`
//    sets exclusive fullscreen at the OS level — there is no Z-order
//    above an exclusive fullscreen window, so the flag is dead weight,
//    and on multi-monitor it has historically caused a brief drop-out
//    of fullscreen when an OS notification fires.
// 2. globalShortcut.register: Alt+Tab, Alt+F4, Ctrl+Esc, Super+L,
//    Super+D, Ctrl+Shift+Esc.
// 3. Windows session policy — CLIENT RESPONSIBILITY, see
//    apps/assaut/README.md.
//    Ctrl+Alt+Del cannot be intercepted from user-mode (Windows secure
//    attention sequence — kernel guarantee). Win+L same path. The third
//    lock is the only way to stop them.
//
// Dev-mode exception: kiosk:true + the global shortcut grabs (esp.
// Ctrl+Shift+Esc swallowing Task Manager) make a `pnpm dev` window
// effectively unescapable on a dev workstation — only Ctrl+Alt+Del
// (sign-out / restart) gets you out, which feels like a system crash.
// Both the BrowserWindow flags and the globalShortcut registration are
// gated on `isProduction` (NODE_ENV=production || app.isPackaged), so
// packaged mallette builds keep the full triple verrou while dev boots
// run as a normal windowed Electron app. The mid-file comment around
// `will-navigate` ("dev is not a kiosk environment") relies on this.

const KIOSK_SHORTCUTS = [
  'Alt+Tab',
  'Alt+F4',
  'Control+Escape',         // Ctrl+Esc, Start menu
  'Super+L',                // Win+L, kernel-intercepted, register() returns false
  'Super+D',                // Win+D, show desktop
  'Control+Shift+Escape',   // Task Manager
] as const

function registerKioskShortcuts(): void {
  // We previously stored the registered/failed split in module-level arrays
  // and surfaced them via an IPC channel for a debug footer in the renderer.
  // That footer was deleted post-M1 validation (it doubled as a fingerprint
  // surface for the renderer with zero runtime payoff). Boot-time visibility
  // is now a console.warn: ops still need to know if Win+L silently failed
  // to register on a particular Windows build, but a compromised renderer
  // no longer learns the kiosk lock state.
  const failed: string[] = []
  for (const accelerator of KIOSK_SHORTCUTS) {
    const ok = globalShortcut.register(accelerator, () => {
      // No-op: swallowing the accelerator is the entire point.
    })
    if (!ok) {
      failed.push(accelerator)
    }
  }
  if (failed.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(
      `[kiosk] globalShortcut.register declined: ${failed.join(', ')} ` +
        '(Super+L is kernel-intercepted by design; others may indicate a ' +
        'Windows policy or a conflicting installed app)',
    )
  }
}

function unregisterKioskShortcuts(): void {
  globalShortcut.unregisterAll()
}

// ----- Window construction ----------------------------------------------------

let mainWindow: BrowserWindow | null = null

const isProduction = process.env['NODE_ENV'] === 'production' || app.isPackaged

function preloadPath(): string {
  return join(fileURLToPath(new URL('.', import.meta.url)), '../preload/index.js')
}

function rendererEntry(): string | URL {
  // ELECTRON_RENDERER_URL is set by electron-vite in dev to the Vite dev
  // server. In prod, load the built file://.
  const devUrl = process.env['ELECTRON_RENDERER_URL']
  if (devUrl !== undefined && devUrl !== '') return devUrl
  return join(fileURLToPath(new URL('.', import.meta.url)), '../renderer/index.html')
}

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    show: false, // show after ready-to-show to avoid white flash
    kiosk: isProduction,
    fullscreen: isProduction,
    frame: false,
    autoHideMenuBar: true,
    backgroundColor: '#000',
    webPreferences: {
      preload: preloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      // Documenting-as-defense: explicit, not relying on the default in
      // case a future Electron release changes it.
      webSecurity: true,
      // Disable DevTools in production. globalShortcut swallows
      // Ctrl+Shift+I; this is the OS-level lock. Kept on in dev for
      // iteration on the renderer.
      devTools: !isProduction,
    },
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
    // Boot signal for tools/scripts/demo-prep.sh and any operator scripts
    // grep-watching the log to know "window is up". Fires in both dev and
    // prod regardless of the kiosk gate, unlike the previous reliance on
    // registerKioskShortcuts() output (now dev-suppressed).
    // eslint-disable-next-line no-console
    console.log('[assaut] window ready')
  })

  mainWindow.removeMenu()

  // setWindowOpenHandler + will-navigate guards live in the global
  // `web-contents-created` hook below so they apply to EVERY WebContents
  // (mainWindow, future webview attachments, DevTools). Hooking only
  // mainWindow.webContents would leave secondary surfaces unguarded.

  const entry = rendererEntry()
  if (entry instanceof URL || /^https?:\/\//.test(String(entry))) {
    mainWindow.loadURL(String(entry))
  } else {
    mainWindow.loadFile(entry as string)
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ----- IPC handlers (typed via @shared/ipc) ----------------------------------

function registerIpcHandlers(): void {
  ipcMain.handle(IpcChannel.AppVersion, (): AppVersionResponse => {
    return {
      app: app.getVersion(),
    }
  })

  ipcMain.handle(IpcChannel.GetGameState, () => {
    return readGameState()
  })

  ipcMain.handle(IpcChannel.SetGameState, (_event, raw: unknown): SetGameStateResponse => {
    // Validate at the IPC boundary — the renderer is sandboxed but a
    // bug there shouldn't be able to write a malformed shape to disk
    // and brick the next read.
    //
    // safeParse rather than parse: a thrown Zod error gets serialised by
    // ipcMain.handle and rejects on the renderer side, where the
    // optimistic local state has already been set — silently dropping
    // the disk write while the UI shows the new value. With safeParse we
    // throw an explicit Error that the renderer's setState catches,
    // logs, and reverts.
    const result = GameState.safeParse(raw)
    if (!result.success) {
      throw new Error(`SetGameState: invalid payload — ${result.error.message}`)
    }
    writeGameState(result.data)
    return { ok: true as const }
  })
}

// ----- Lifecycle --------------------------------------------------------------

if (gotLock) {
  app.on('second-instance', () => {
    if (mainWindow !== null) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(() => {
    if (isProduction) registerKioskShortcuts()
    registerIpcHandlers()
    createMainWindow()

    // macOS would normally re-open a window on activate; Windows mallette
    // never expects activate, but kept for dev parity on Macs.
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
    })
  })
}

// Defensive: every WebContents (mainWindow, DevTools, any future
// `<webview>` attachment) gets the same triple guard:
//
//   1. setWindowOpenHandler: deny popups + dialogs
//   2. will-attach-webview: prevent webviews from attaching with their
//      own (potentially weaker) webPreferences
//   3. will-navigate: deny navigation away from the renderer entry,
//      compared by parsed origin + pathname so trailing slash / hash /
//      query-string variations don't either falsely block legitimate
//      Vite HMR navigations OR allow a `?injected=payload` smuggle
//
// Hooking via `web-contents-created` is critical because creating the
// hook only on `mainWindow.webContents` (as it was originally) leaves
// any subsequent WebContents — including DevTools in dev — with an
// unguarded navigation surface.
app.on('web-contents-created', (_event, contents) => {
  // Hoist rendererEntry() out of the navigation handler. The value is
  // process-stable (driven by ELECTRON_RENDERER_URL set once by
  // electron-vite at boot, or the bundled file:// path), so computing it
  // once per WebContents creation rather than once per navigation is
  // both cheaper and simpler to reason about.
  const allowedEntry = rendererEntry()
  const allowedStr = allowedEntry instanceof URL ? allowedEntry.href : String(allowedEntry)

  contents.setWindowOpenHandler(() => ({ action: 'deny' }))
  contents.on('will-attach-webview', (e) => e.preventDefault())
  contents.on('will-navigate', (event, url) => {
    // Origin + pathname comparison. In production the renderer is loaded
    // via loadFile() so `allowedEntry` is a `file://` URL with an exact
    // pathname; the pathname check is the primary guard. In dev,
    // `allowedEntry` is the Vite dev URL (typically `http://localhost:5173/`)
    // and the pathname is `/`, so the guard reduces to origin-only —
    // this is acceptable because (a) dev is not a kiosk environment and
    // (b) `webSecurity: true` + sandbox prevent escalation regardless.
    try {
      const parsedAllowed = new URL(allowedStr)
      const parsedTarget = new URL(url)
      if (
        parsedTarget.origin !== parsedAllowed.origin ||
        parsedTarget.pathname !== parsedAllowed.pathname
      ) {
        event.preventDefault()
      }
    } catch {
      event.preventDefault()
    }
  })
})

app.on('window-all-closed', () => {
  unregisterKioskShortcuts()
  if (process.platform !== 'darwin') app.quit()
})

app.on('will-quit', () => {
  unregisterKioskShortcuts()
})
