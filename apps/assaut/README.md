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
[`.claude/rules/assaut.md`](../../.claude/rules/assaut.md).

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
