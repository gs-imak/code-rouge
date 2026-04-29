# `@code-rouge/assaut`

« Assaut » — the Espace 3 application. Runs on a Windows PC mallette behind
the venue, in **kiosk mode**, with no exit path the player can trigger from
the keyboard or mouse. Built on Electron + React + Vite (electron-vite).

## Aesthetic

"Section 13" hacker terminal — dark palette, monospace, dramatic transitions.
Placeholder UI ships with chantier 04; final maquettes integrate via
`@code-rouge/design-system` once delivered.

## Kiosk lock — triple verrou

Three layered locks. Each protects against a different escape vector. The
first two live in this app; the third is the venue's responsibility.

### 1. BrowserWindow flags (this app, `src/main/index.ts`)

```ts
new BrowserWindow({
  kiosk: true,
  fullscreen: true,
  frame: false,
  alwaysOnTop: true,
  autoHideMenuBar: true,
  webPreferences: {
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
  },
})
```

Plus:

- `mainWindow.removeMenu()` — no File/Edit/View menubar.
- `setWindowOpenHandler(() => ({ action: 'deny' }))` — popups blocked.
- `will-navigate` denies any navigation away from the renderer entry.
- `app.requestSingleInstanceLock()` — accidental double-launch refocuses.

### 2. `globalShortcut.register` (this app, `src/main/index.ts`)

Swallowed while Assaut is focused:

| Shortcut | Effect blocked |
|---|---|
| `Alt+Tab` | App switcher |
| `Alt+F4` | Window close |
| `Ctrl+Esc` | Start menu |
| `Super+L` | Lock workstation (see caveat below) |
| `Super+D` | Show desktop |
| `Ctrl+Shift+Esc` | Task Manager |

Unregistered on `will-quit` so dev iterations don't accumulate stale hooks.

### 3. Windows session policy — **CLIENT RESPONSIBILITY**

Configured by Nathanael's hardware team on the deployed mallette PC, not by
this app:

- A dedicated Windows kiosk user account with no shell access, auto-login.
- Group Policy / registry to disable Ctrl+Alt+Del options
  (`HKCU\Software\Microsoft\Windows\CurrentVersion\Policies\System` →
  `DisableTaskMgr`, `DisableLockWorkstation`, etc.).
- Removable-media autorun disabled.
- USB HID restriction (only the chosen keyboard, no mass-storage).

## Ctrl+Alt+Del — not blockable from user-mode

Windows treats `Ctrl+Alt+Del` as the **secure attention sequence (SAS)**.
The kernel intercepts it before any user-mode hook can see it, and shows the
secure desktop (Lock / Switch User / Task Manager / Sign out / Cancel).
**This is by design and cannot be circumvented from an Electron app — or
from any user-mode software.** The third lock (above) is the only mitigation:

- The kiosk user account has Task Manager and Lock Workstation disabled via
  Group Policy, so even from the secure desktop those entries are greyed out.
- Sign-out is acceptable — at that point the auto-login policy logs the
  kiosk user back in, which restarts Assaut via systemd-equivalent (Windows
  task scheduled at login) and rejoins the session via the WS server.

`Win+L` (workstation lock) has the same kernel-level path and is similarly
unblockable. Same mitigation applies.

## IPC

Renderer ↔ main go through Zod-validated channels defined in
`src/shared/ipc.ts`. The preload script exposes a narrow bridge surface
(`window.assaut`); the renderer never touches `ipcRenderer` directly. Adding
a channel:

1. Append to `IpcChannel` in `src/shared/ipc.ts`.
2. Define the request/response Zod schemas there.
3. Register a handler in `src/main/index.ts` (`ipcMain.handle(...)`).
4. Expose it on the `AssautBridge` interface, wire it in `src/preload/index.ts`.

## Local development

```bash
pnpm dev --filter @code-rouge/assaut
```

This launches `electron-vite dev`, which runs the Vite dev server for the
renderer + spawns Electron with the kiosk flags applied. **Note:** in dev
the window is full-screen, frameless, and always-on-top — closing it from
inside is by design impossible. Kill the dev process from the terminal that
launched it (Ctrl+C in that terminal), or use Task Manager via Ctrl+Alt+Del
on Windows. For lighter iteration on the renderer alone (no kiosk), set
`KIOSK_DISABLED=1` in `.env.local` — TODO chantier 05.

```bash
pnpm build --filter @code-rouge/assaut    # bundles main + preload + renderer
pnpm lint --filter @code-rouge/assaut
pnpm typecheck --filter @code-rouge/assaut
```

## Production build (chantier 05+)

Packaging via `electron-builder` is wired in `package.json` devDependencies
but not yet scripted. Chantier 05 adds the signed `.exe` build pipeline.

## Sequence linéaire

The game runs through 7 ordered steps (Début → Perdus → Patrouille → Perdus 2
→ McGyver → RDV Indic → Couper le fil → Épilogue) defined in
`assets/config/sequence.json`. Branchements are JSON-described conditional
jumps, **never hardcoded `if` statements**. Sequence loading lands chantier
05+ along with the persistence resume flow.

## Media

`<video>` and `<audio>` natively in the renderer. No `ffmpeg` or heavy media
libs. Sources are local `file://` URIs to mp4/mp3 in `assets/media/`. The
renderer's CSP (in `index.html`) allows `media-src 'self' file:`.
