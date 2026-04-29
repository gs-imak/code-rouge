# Session Context

> **Read this first at the start of every session.**
> Update this file at the end of every session.

---

## Last session (2026-04-29)

**Chantiers 01 + 02 + 03 all DONE & MERGED.** CI green on every chantier merge into `main`.

### main now has

```
d415be4 feat: chantier 03 — local NUC server (Express + WS + SQLite + Zod) (#6)
f67e428 chore(deps): bump the actions group with 3 updates (#4)
952fd20 docs: mark chantier 02 fully shipped, brief chantier 03 (#5)
35fde9a feat: chantier 02 — CI pipeline + Vitest at root (#3)
b2218aa refactor: chantier 01 quality-gate review fixes (#2)
86e2d91 chore: scaffold monorepo (chantier 01) (#1)
a92df49 chore: initial bundle (CLAUDE.md, docs, rules)
```

### Chantier 03 deliverables (PR #6)

- `apps/server-nuc/src/{index,config,logger,db,session}.ts` — Express on `:8080`, route-scoped WS at `/ws`, pino, graceful shutdown with WAL checkpoint.
- `apps/server-nuc/migrations/001_init.sql` — STRICT `sessions` + `team_state` (PK `(session_id, team_id, app)`) + relaxed `event_log` (AUTOINCREMENT, idx on `(session_id, team_id, at)`).
- `packages/shared-types/src/messages.ts` — App↔Server discriminated unions with Zod, `parseAppToServerMessage` / `parseServerToAppMessage` / `parseMessage` (alias). 15 round-trip + negative-path tests.
- `tools/scripts/install-nuc.sh` — idempotent NodeSource + corepack + systemd + logrotate provisioning. Hardened systemd unit (NoNewPrivileges, ProtectSystem, ProtectHome, PrivateTmp, RestrictAddressFamilies, MemoryMax=512M, CPUQuota=80%, IPAddressDeny=any with RFC-1918 allow). Hard-fails on `LISTEN_HOST=0.0.0.0`. Optional NodeSource setup-script sha256 verify (env `NODESOURCE_SETUP_SHA256`). `shellcheck tools/scripts/*.sh` step added to the lint job in CI.
- `apps/server-nuc/README.md` — endpoints, env vars, dev quickstart, prod deploy walkthrough, filesystem layout, operator commands.

### Chantier 03 ACs verified empirically

- ✅ `pnpm dev --filter @code-rouge/server-nuc` boots clean
- ✅ `curl /health` → 200 with `{ status, uptimeSeconds, pid, sessionId, db }`; `db: ok` via hoisted `pingStmt`
- ✅ WS `/ws` handshake → `welcome` reply; WS `/wrong` → `HTTP/1.1 404 Not Found` then destroy
- ✅ `state` update → row in `team_state`; `log` push → row in `event_log` (events JSON-serialised)
- ✅ Stop + restart server (same `DATABASE_PATH`) → previous rows still in DB
- ✅ `pnpm typecheck` → 7/7; `pnpm test` → 16/16; `pnpm -r run lint` → 0; `shellcheck install-nuc.sh` → 0
- ✅ CI on main run [25125605549](https://github.com/gs-imak/code-rouge/actions/runs/25125605549) → 5/5 green

### Quality gate (4 agents in parallel) — 11 fixes applied on the same chantier branch

P0 (DoS / integrity): fragmented WS frame `Buffer[]` handling, `shuttingDown` flag for graceful shutdown, WS `maxPayload: 512 KB`, `resetCode` redacted in boot log (`"95****"`).

P1 (durability + sec): `synchronous = FULL` (was NORMAL — survives chantier 05's hard reboot), `wal_checkpoint(TRUNCATE)` on shutdown, hoisted `pingStmt` for /health, `crypto.randomInt` for `newResetCode` (was modulo-biased), per-connection token-bucket rate limit at 100 frames/sec, `LogEvent.data` tightened to bounded record, WS upgrade rejection writes HTTP 404, `install-nuc.sh` rejects 0.0.0.0, NodeSource sha256 verify, pinned pnpm via `package.json:packageManager`, post-install /health curl check.

P2: `install-nuc.sh` idempotent restart (cmp + reload-or-restart), systemd MemoryMax/CPUQuota/IPAddressDeny=any, `cache_size = -32768` + `temp_store = MEMORY`, `DbHandle.db` removed from public shape.

Deferred to chantier 04 with concrete code in PR #6 description: SHA-pin actions, composite setup action, gate signing jobs, drop `--prod=false` once tsx is replaced by tsc build pipeline.

---

## Currently in progress

_(none — chantier 03 done, awaiting next session for chantier 04)_

---

## Blocked / waiting on Georges

_(none)_

## Notes (non-blocking)

- **2 moderate vulnerabilities** still in transitive dev deps (visible via `pnpm audit`). Below the High threshold so CI passes. Worth a 5-min triage when convenient — possibly already addressed by Dependabot.
- **Vercel-related session hooks** continue to fire (workflow YAML, package.json, Express). Ignored — project is offline-only.
- **CI now also runs `shellcheck`** on every push for `tools/scripts/*.sh`. Future chantier 04 RN/Electron build hooks will get the same treatment.

---

## Next concrete task

**Chantier 04 — Mode kiosque (Android + Windows)** (`docs/m1-plan.md` § Chantier 04).

**Day:** J4 — Fri 1 May 2026.

**Branch:** `feat/chantier-04-kiosk`.

In order:
1. **4.1** — React Native scaffolding for `apps/attaque-de-bots` and `apps/debriefing`. Bare TypeScript template (NOT Expo — kiosk requires native modules). Metro config: `watchFolders` includes workspace root, `nodeModulesPaths` includes monorepo `node_modules`. One placeholder screen "Connexion équipe — placeholder".
   - **AC:** `pnpm android --filter @code-rouge/attaque-de-bots` builds + installs on a connected device/emulator. App opens, shows the placeholder.
2. **4.2** — Screen Pinning native module (Java/Kotlin). `ActivityManager.startLockTask()` on app start. Permission check + Settings → Security → Screen Pinning instruction if not granted. Disable Back button at root navigator.
   - **AC:** Once pinned, all of Home, Recents, Back, swipes, notification shade fail to exit. Force-stop via Settings still works (we don't fight the OS-level kill).
3. **4.3** — Electron + Vite + React TS scaffold for `apps/assaut`. `BrowserWindow({ kiosk: true, fullscreen: true, frame: false, autoHideMenuBar: true, webPreferences: { contextIsolation: true } })`. Single placeholder screen "Section 13 — Saisie code autorisation".
   - **AC:** `pnpm dev --filter @code-rouge/assaut` opens fullscreen. No minimize/resize/close.
4. **4.4** — Windows shortcut blocking via `globalShortcut.register` for Alt+Tab, Alt+F4, Ctrl+Esc, Super+L, Super+D, Ctrl+Shift+Esc. Document Ctrl+Alt+Del as out-of-scope (Windows secure attention sequence — not user-mode interceptable; venue session policy is the third lock).
   - **AC:** All listed shortcuts no-op while Assaut is focused. README documents the Ctrl+Alt+Del limitation and points to client-side mitigation.

**Heads-up for chantier 04 specifically (from PR #6 deferrals):**
- **CI hardening once secrets land:** SHA-pin `actions/checkout`, `actions/setup-node`, `pnpm/action-setup`. Composite setup action at `.github/actions/setup-node-pnpm/action.yml` (build-windows will switch to `windows-latest` and have a different pnpm store path). Gate `build-android` / `build-windows` to `if: github.event_name == 'push' && github.ref == 'refs/heads/main'` once they read `ANDROID_KEYSTORE_BASE64` / `WINDOWS_CODESIGN_CERT_BASE64`. Pass secrets via `env:` on the specific `run:` step, not at job level.
- **Build pipeline:** server-nuc currently runs via `tsx` in production. Chantier 04 should consider switching to a tsc + tsup/esbuild compile so `pnpm install --prod` (no `--prod=false`) works on the NUC, dropping ~80 dev deps.
- **RN bare template + monorepo:** `metro.config.js` must add the workspace root to `watchFolders` and `nodeModulesPaths`, AND set `resolver.disableHierarchicalLookup = true` to play well with pnpm's hoisted layout. The `.npmrc` `node-linker=hoisted` + `shamefully-hoist=true` is already in place.
- **Electron + Vite:** prefer `electron-vite` for the scaffold. Renderer ↔ main IPC must go through Zod-validated channels per `.claude/rules/assaut.md`.
- **Native module testing:** Screen Pinning and global-shortcut hooks need physical-device or emulator validation — chantier 04 ACs cannot be fully verified without one. Plan the demo path early.
- **Per-package test footgun**: when `apps/{attaque-de-bots, assaut, debriefing}` add tests, **do not** add `test` scripts at the package level (still the closed footgun). Vitest at root finds them via `apps/**/*.test.{ts,tsx}`.

**Standing instruction (from memory):** at end of chantier 04, run code-reviewer + security-auditor (kiosk lock, IPC validation, native module surface) + performance-optimizer (RN 60fps target, Electron renderer paths) + refactoring-specialist quality gates before opening the PR. Apply P1 findings on the same branch. Merge green PRs (including Dependabot) without prompting.

---

## Format for future updates

When you update this file, replace the section bodies above. Keep the
section headers as-is. Be specific:

**Good entry**
```
## Last session (2026-05-01)
- Completed Chantier 04: kiosk lock validated on tablet + PC mallette;
  Alt+Tab, Win key, Home, Back all no-op. RN apps install via
  `pnpm android`. Electron Assaut opens fullscreen with no chrome.
- Pushed: PR #N, merged squash to main as <sha>.
- All M1 ACs for chantier 04 met empirically.
```

**Bad entry**
```
## Last session
- Did some setup. Things are progressing.
```

The bad version is useless next session. Be a future-you who has zero memory
of today.
