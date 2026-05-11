# `@code-rouge/assaut`

« Assaut » — the Espace 3 application. Runs on a Windows PC mallette behind
the venue, in **kiosk mode**, with no exit path the player can trigger from
the keyboard or mouse. Built on Electron + React + Vite (electron-vite).

## Aesthetic

"Section 13" hacker terminal — dark palette, monospace, dramatic transitions.
Placeholder UI ships with chantier 04; final maquettes integrate via
`@code-rouge/design-system` once delivered.

## Kiosk lock

Triple verrou — implementation, accelerator list, and Ctrl+Alt+Del / Win+L
caveats are documented inline in [`src/main/index.ts`](./src/main/index.ts)
(top-of-file comment) and authoritatively in
[`docs/conventions/assaut.md`](../../docs/conventions/assaut.md).

The third lock — **Windows session policy** — is the venue's responsibility:
a dedicated kiosk user account with auto-login, Group Policy disabling
Task Manager / Lock Workstation, removable-media autorun off, USB HID
restriction. Documented in the operator runbook (Nathanael's hardware
team, not this codebase).

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
renderer + spawns Electron with kiosk flags **gated on `app.isPackaged`**.
In dev (`pnpm dev`) the window is a normal Electron window with a titlebar
and `Alt+F4` works — the kiosk lock only activates in packaged builds, so
you can close the dev window like any other app. The full triple verrou
(BrowserWindow `kiosk:true` + `globalShortcut.register` + Windows session
policy) only takes effect in the production `.exe`.

```bash
pnpm build --filter @code-rouge/assaut    # bundles main + preload + renderer
pnpm lint --filter @code-rouge/assaut
pnpm typecheck --filter @code-rouge/assaut
```

## Production build

`pnpm package:win` (defined in this app's `package.json`) runs
`electron-vite build` followed by `electron-builder --config
electron-builder.yml --win nsis`, producing a `.exe` installer in
`apps/assaut/release/`. CI runs the same pipeline on every push to `main`
and uploads the artifact under the name `code-rouge-assaut-exe` (14-day
retention). The latest stable build is also attached to the
[`v0.1.0` GitHub Release](https://github.com/gs-imak/code-rouge/releases/tag/v0.1.0).

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
