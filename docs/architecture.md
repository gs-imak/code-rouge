# Architecture — Code Rouge

This document captures the load-bearing technical decisions. Update it when
a decision changes, **with a dated entry in "Decision log" at the bottom**.

---

## 1. Monorepo

**Tooling:** pnpm 9 workspaces + Turborepo.

**Why pnpm:** efficient disk usage, deterministic, native workspace support.
RN 0.77+ supports pnpm cleanly with `node-linker=hoisted` (set in `.npmrc`).

**Why Turborepo:** task graph + remote cache (we'll only use local cache for
M1), easy `--filter` syntax for working in one app at a time.

```
code-rouge/
├── apps/
│   ├── attaque-de-bots/      # @code-rouge/attaque-de-bots — RN, Android tablet
│   ├── assaut/               # @code-rouge/assaut — Electron+React, Windows
│   ├── debriefing/           # @code-rouge/debriefing — RN, Android phone
│   └── server-nuc/           # @code-rouge/server-nuc — Node, Linux NUC
├── packages/
│   ├── design-system/        # @code-rouge/design-system — tokens, themed components
│   ├── shared-types/         # @code-rouge/shared-types — Zod schemas, TS types
│   └── shared-utils/         # @code-rouge/shared-utils — date, hash, retry, logger
├── tools/scripts/            # install-nuc.sh, demo helpers
├── docs/                     # this file, m1-plan.md, glossary.md
└── .claude/rules/            # path-scoped rules per app
```

### Why packages/ vs apps/

- **apps/** = something that runs (has a main entry, is buildable as a final artifact).
- **packages/** = something other apps consume (published intra-monorepo only).

Don't put runtime code in `apps/server-nuc` that would be useful to another
app — extract it to `packages/shared-*` instead. Today's shared code is
tomorrow's reuse.

---

## 2. Frontend stack

### Android apps (Attaque de Bots, Débriefing)

- **React Native** (latest stable, bare TypeScript template).
- **State:** Zustand for app-level state. Local persistence via
  `@react-native-async-storage/async-storage`.
- **Navigation:** React Navigation, native stack. Back gesture disabled at
  the root for kiosk.
- **Styling:** Tokens from `@code-rouge/design-system`. No external UI kit
  (no Material, no NativeBase) — graphics are bespoke per the maquettes.
- **Animations:** Reanimated 3.

### Windows app (Assaut)

- **Electron** with the **electron-vite** template.
- **Renderer:** React 18 + Vite + TypeScript.
- **State:** Zustand (renderer); main-process state held in a typed
  `electron-store`.
- **IPC:** typed via Zod-validated channels (no untyped `ipcRenderer.send`).
- **Styling:** same `@code-rouge/design-system` tokens, themed for the
  hacker terminal aesthetic per the maquettes.

### Why the same render layer everywhere

React in both Electron and React Native maximizes design-system reuse.
Components in `@code-rouge/design-system` compile to web (Electron) and
native (RN) by exporting both web and native variants from the same package.

> **Implementation note:** the design-system package will have
> `src/components/Button.tsx` (RN) and `src/components/Button.web.tsx`
> (Electron). React Native's bundler picks `.tsx`, Vite picks `.web.tsx`
> via a resolver alias. Document this in `packages/design-system/README.md`
> when chantier 01 lands.

---

## 3. Server (NUC)

- **Runtime:** Node 22 LTS.
- **Framework:** Express for HTTP (health, setup endpoints), `ws` for WebSocket.
- **Database:** SQLite via `better-sqlite3` (synchronous API, perfect for
  embedded use, no async juggling for what is fundamentally a single-writer
  DB on a small device).
- **Logging:** `pino` (structured JSON logs), `pino-pretty` only in dev.
- **Process management:** `systemd` unit on the NUC. No PM2.
- **Validation:** every inbound payload (HTTP body, WebSocket message)
  validated with Zod from `@code-rouge/shared-types` before touching state.

### Endpoints

```
GET  /health           → 200 OK, { status: 'ok', uptime, db: 'ok' }
GET  /diag             → returns wifi quality, connected client count, etc.
POST /admin/reset      → wipes session state (game master only, behind a code)
WS   /ws               → primary channel: hello → state ⇄ commands → log push
```

---

## 4. WebSocket protocol

Discriminated unions, validated by Zod. All messages have a `type` field.

### App → Server

| Type | Purpose |
|---|---|
| `hello` | Announce app, deviceId, current teamId (if known). Always first message. |
| `state` | Periodic snapshot of app's current step + score. Throttled to ≤ 1/s. |
| `log` | Batched log events flushed at end of session or on every Nth event. |
| `pong` | Reply to server `ping`. |

### Server → App

| Type | Purpose |
|---|---|
| `welcome` | Reply to `hello`. Confirms teamId or assigns one. |
| `restore` | If we have prior state for `(teamId, app)`, send it back. App reconciles. |
| `cmd` | `{ cmd: 'reset' | 'sync' | 'shutdown' }`. Game master commands. |
| `ping` | Liveness probe, every 10 s. |

### Schemas

Defined in `packages/shared-types/src/messages.ts`. Imported by both apps
and server. **Single source of truth for the wire format.** Never define
message shapes in app code.

### Reconnection policy

- Apps reconnect with exponential backoff (1 s, 2 s, 4 s, 8 s, max 30 s).
- On reconnect, app re-sends `hello` with `lastKnownStep` so server can
  decide whether to `restore` or accept current state.
- Server tracks `(deviceId, teamId)` in memory; on disconnect, doesn't
  forget — keeps for 5 minutes.

---

## 5. Persistence model

Three layers. Each is the source of truth for different fields.

| Layer | Source of truth for | Tech |
|---|---|---|
| Server SQLite | `teamId` ↔ `app` mapping, end-of-session logs, cross-app aggregates | `better-sqlite3` |
| App local store | UI step, scratch state, draft inputs | AsyncStorage (RN), electron-store (Electron) |
| In-memory | Frame-by-frame state, animation values | Zustand |

### Restore flow on cold boot

```
App boots
  → reads local store
  → if empty: shows team-select screen
  → if present: restores step + score + draft
  → connects WS
  → sends hello{ teamId, lastKnownStep }
  → server replies welcome / restore
  → app reconciles (server wins for teamId, app wins for currentStep)
```

### "Reconciles" — what that means concretely

If the server says `teamId: 7` but the local store says `teamId: 5`, server
wins. (Reason: the game master may have re-assigned teams.) If the server
says `currentStep: 3` but the app says `currentStep: 5`, app wins. (Reason:
the app made progress while disconnected.) The app then immediately sends
a fresh `state` to bring the server up to date.

---

## 6. Kiosk mode

### Android (RN apps)

- **Screen Pinning** via native module calling `ActivityManager.startLockTask()`.
- Disable back gesture at the root navigator.
- Hide the system status bar (`StatusBar.setHidden(true)`).
- For production, the device should be in **device-owner mode** (set up by
  Nathanael's hardware team via ADB during initial provisioning). This is
  documented in the M1 doc as out-of-scope for the dev — it's a deployment
  concern, not a build concern.

### Windows (Electron Assaut)

Triple lock per the proposition:

1. **Electron**: `kiosk: true, fullscreen: true, frame: false, alwaysOnTop: true`.
2. **Global shortcuts**: `Alt+Tab`, `Alt+F4`, `Ctrl+Esc`, `Super+L`,
   `Super+D`, `Ctrl+Shift+Esc` swallowed via `globalShortcut.register`.
3. **Windows session policy**: configured by client on the deployed PC
   (group policy / registry to disable Ctrl+Alt+Del options, kiosk user
   account). Out of scope for our code; documented in `apps/assaut/README.md`.

**Ctrl+Alt+Del cannot be intercepted from user-mode** by design (Windows
secure attention sequence). This is acknowledged and accepted; the third
lock above mitigates it.

---

## 7. Data-driven configuration

All game content (texts, timings, énigme matrices, media paths) lives in
JSON files validated by Zod schemas in `@code-rouge/shared-types`.

Locations:
- Cross-app config (team IDs, version variants): `packages/shared-types/configs/`.
- Per-app content: `apps/<app>/assets/config/`.

**Rule:** if it's a string the player reads, it's in JSON. If it's a number
that controls timing, it's in JSON. If it's a media reference, it's in JSON.

The variants mentioned in the proposition (standard / courte / longue /
personnalisée) are config files: `game.standard.json`, `game.short.json`,
etc., loaded at boot based on game-master selection.

---

## 8. Build & release

### Local development

- `pnpm dev` — runs all apps + server in watch mode (Turborepo orchestrates).
- `pnpm dev --filter assaut` — one app, faster iteration.

### CI builds (GitHub Actions)

- On every push: lint, typecheck, test.
- On every push to `main`: also build-android (debug APK), build-windows
  (debug exe), build-server (Node bundle).
- On tag `v*.*.*`: same builds, but **release-signed** (M3 only — M1/M2
  use debug signing).

### Signing (M3 deliverable, not now)

- **Android**: upload key generated and stored in 1Password (Georges) +
  GitHub Actions secret. `keystore.jks` never committed.
- **Windows**: code-signing certificate purchased by The Game (per propal,
  client cost), used via Actions secret.

---

## 9. Decision log

Keep this section append-only. Date every entry.

- **2026-04-29 — Initial decisions.** RN for Android × 2, Electron for Windows,
  pnpm + Turborepo, TypeScript strict, Vitest, ESLint+Prettier, Node 22 LTS.
  Decided in proposal acceptance + day-0 alignment with Georges.
