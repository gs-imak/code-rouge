import { app, BrowserWindow, globalShortcut, ipcMain } from 'electron'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  IpcChannel,
  KioskStatusResponse,
  AppVersionResponse,
} from '../shared/ipc.js'

// ----- Kiosk lock — triple verrou per .claude/rules/assaut.md ----------------
//
// 1. BrowserWindow: kiosk + fullscreen + frame:false + alwaysOnTop
// 2. globalShortcut.register: Alt+Tab, Alt+F4, Ctrl+Esc, Super+L, Super+D, Ctrl+Shift+Esc
// 3. Windows session policy — CLIENT RESPONSIBILITY, see apps/assaut/README.md.
//    Ctrl+Alt+Del cannot be intercepted from user-mode (Windows secure attention
//    sequence — kernel guarantee). The third lock is the only way to stop it.

// Shortcuts we attempt to swallow on focus. The list is fixed at boot so we
// can answer KioskStatus deterministically.
const KIOSK_SHORTCUTS = [
  'Alt+Tab',
  'Alt+F4',
  'Control+Escape',     // Ctrl+Esc — opens Start menu
  'Super+L',            // Win+L — lock workstation (NOT actually blockable on
                        //         modern Windows, see comment below)
  'Super+D',            // Win+D — show desktop
  'Control+Shift+Escape', // Task Manager
] as const

const REGISTERED_SHORTCUTS: string[] = []

function registerKioskShortcuts(): void {
  // Important Windows caveat: Win+L invokes a kernel-level user-switch path
  // and cannot be intercepted from user-mode, same as Ctrl+Alt+Del. We keep
  // it in the list both to suppress accidental presses where Electron does
  // get the event AND for documentation parity with the proposal. The venue
  // session policy (third lock) is what actually prevents lock-screen escape.
  for (const accelerator of KIOSK_SHORTCUTS) {
    const ok = globalShortcut.register(accelerator, () => {
      // No-op: swallowing the accelerator is the entire point.
    })
    if (ok) {
      REGISTERED_SHORTCUTS.push(accelerator)
    }
  }
}

function unregisterKioskShortcuts(): void {
  globalShortcut.unregisterAll()
  REGISTERED_SHORTCUTS.length = 0
}

// ----- Window construction ----------------------------------------------------

let mainWindow: BrowserWindow | null = null

function preloadPath(): string {
  // out/preload/index.js is emitted by electron-vite. In dev, electron-vite
  // serves the same path via a watch process.
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
    alwaysOnTop: true,
    autoHideMenuBar: true,
    backgroundColor: '#000',
    webPreferences: {
      preload: preloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      // Disable navigation away from the renderer URL — see app.on('web-contents-created') below.
    },
  })

  mainWindow.once('ready-to-show', () => mainWindow?.show())

  // Disable the default menu (File/Edit/View) — kiosk doesn't surface it.
  mainWindow.removeMenu()

  // Block opening external links in a new window. Anything the player clicks
  // that would navigate elsewhere is denied. The kiosk has no business
  // opening browsers or devtools.
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  // Prevent navigation outside the renderer entry. Anything attempting to
  // load a different origin is cancelled — even file:// → file:// hops.
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const allowed = rendererEntry()
    const allowedHref = allowed instanceof URL ? allowed.href : allowed
    if (url !== allowedHref) {
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
    }
  })

  ipcMain.handle(IpcChannel.AppVersion, (): AppVersionResponse => {
    return {
      electron: process.versions.electron ?? 'unknown',
      app: app.getVersion(),
      platform: process.platform,
    }
  })
}

// ----- Lifecycle --------------------------------------------------------------

app.whenReady().then(() => {
  registerKioskShortcuts()
  registerIpcHandlers()
  createMainWindow()

  // macOS would normally re-open a window on activate; on Windows mallette
  // we never expect activate, but keep parity for dev macs.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

// Single-instance lock — if a user (or a bug) double-launches Assaut,
// focus the existing window instead of opening a second kiosk.
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow !== null) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

// Defensive: deny any new web-contents (popups, dialogs) trying to attach.
app.on('web-contents-created', (_event, contents) => {
  contents.setWindowOpenHandler(() => ({ action: 'deny' }))
})

app.on('window-all-closed', () => {
  unregisterKioskShortcuts()
  if (process.platform !== 'darwin') app.quit()
})

app.on('will-quit', () => {
  unregisterKioskShortcuts()
})
