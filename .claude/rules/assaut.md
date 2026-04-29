# Rules — apps/assaut

These rules apply when editing files under `apps/assaut/`.

- **Target device:** Windows 10/11 PC mallette, 15"+ display, keyboard.
  Design for keyboard input + mouse; touch is not assumed.
- **Aesthetic:** "Section 13" hacker terminal — dark palette, monospace
  for codes/commands, dramatic transitions. Reference the maquettes when
  they land; until then, use placeholder palette from design-system.
- **Kiosk lock — triple verrou:**
  1. `BrowserWindow({ kiosk: true, fullscreen: true, frame: false, alwaysOnTop: true })`
  2. `globalShortcut.register` for Alt+Tab, Alt+F4, Ctrl+Esc, Super+L,
     Super+D, Ctrl+Shift+Esc
  3. Windows session policy — **client responsibility**, documented in
     this app's README, not implemented in our code.
- **Ctrl+Alt+Del cannot be intercepted from user-mode.** This is a Windows
  kernel guarantee (secure attention sequence). Don't try. Document the
  limitation in any kiosk-related PR.
- **Main vs renderer:** kiosk hooks, file system, store live in **main**.
  UI lives in **renderer**. They communicate via Zod-validated IPC channels
  defined in `apps/assaut/src/shared/ipc.ts`.
- **Sequence linéaire:** the game is 7 ordered steps (Début → Perdus →
  Patrouille → Perdus 2 → McGyver → RDV Indic → Couper le fil → Épilogue).
  Defined in `assets/config/sequence.json`. Branchements are JSON-described
  conditional jumps, not hardcoded `if`.
- **Media playback:** use the renderer's native `<video>` and `<audio>`
  elements. Don't add ffmpeg/heavy media libs. Sources are local file://
  URIs to bundled mp4/mp3.
- **Performance:** Electron + React on a mid-range Windows PC. No reason
  for jank. Profile with React DevTools if a screen feels slow.
