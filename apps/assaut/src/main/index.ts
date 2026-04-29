import { app, BrowserWindow, globalShortcut, ipcMain } from 'electron'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  IpcChannel,
  KioskStatusResponse,
  AppVersionResponse,
} from '../shared/ipc.js'

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

const KIOSK_SHORTCUTS = [
  'Alt+Tab',
  'Alt+F4',
  'Control+Escape',         // Ctrl+Esc — Start menu
  'Super+L',                // Win+L — kernel-intercepted, register() returns false
  'Super+D',                // Win+D — show desktop
  'Control+Shift+Escape',   // Task Manager
] as const

const REGISTERED_SHORTCUTS: string[] = []
const FAILED_SHORTCUTS: string[] = []

function registerKioskShortcuts(): void {
  for (const accelerator of KIOSK_SHORTCUTS) {
    const ok = globalShortcut.register(accelerator, () => {
      // No-op: swallowing the accelerator is the entire point.
    })
    if (ok) {
      REGISTERED_SHORTCUTS.push(accelerator)
    } else {
      FAILED_SHORTCUTS.push(accelerator)
    }
  }
}

function unregisterKioskShortcuts(): void {
  globalShortcut.unregisterAll()
  REGISTERED_SHORTCUTS.length = 0
  FAILED_SHORTCUTS.length = 0
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
    kiosk: true,
    fullscreen: true,
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

  mainWindow.once('ready-to-show', () => mainWindow?.show())

  mainWindow.removeMenu()

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  // Block navigation away from the renderer entry. Compare origin +
  // pathname (parsed) so trailing slash, fragment, and query-string
  // variations don't either falsely block legitimate Vite HMR navigations
  // (origin matches) or falsely allow a `?injected=payload` smuggle
  // (pathname differs).
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const allowed = rendererEntry()
    const allowedStr = allowed instanceof URL ? allowed.href : String(allowed)
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
      // Unparseable URL — block it.
      event.preventDefault()
    }
  })

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
  ipcMain.handle(IpcChannel.KioskStatus, (): KioskStatusResponse => {
    const win = mainWindow
    return {
      fullscreen: win?.isFullScreen() ?? false,
      kiosk: win?.isKiosk() ?? false,
      globalShortcutsRegistered: [...REGISTERED_SHORTCUTS],
      globalShortcutsFailed: [...FAILED_SHORTCUTS],
    }
  })

  ipcMain.handle(IpcChannel.AppVersion, (): AppVersionResponse => {
    return {
      app: app.getVersion(),
    }
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
    registerKioskShortcuts()
    registerIpcHandlers()
    createMainWindow()

    // macOS would normally re-open a window on activate; Windows mallette
    // never expects activate, but kept for dev parity on Macs.
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
    })
  })
}

// Defensive: deny any new web-contents (popups, dialogs) AND prevent
// `<webview>` from attaching with its own (potentially weaker) webPreferences.
app.on('web-contents-created', (_event, contents) => {
  contents.setWindowOpenHandler(() => ({ action: 'deny' }))
  contents.on('will-attach-webview', (e) => e.preventDefault())
})

app.on('window-all-closed', () => {
  unregisterKioskShortcuts()
  if (process.platform !== 'darwin') app.quit()
})

app.on('will-quit', () => {
  unregisterKioskShortcuts()
})
