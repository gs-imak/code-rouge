# Session Context

> **Read this first at the start of every session.**
> Update this file at the end of every session.

---

## Last session (2026-04-29)

**Chantiers 01 + 02 + 03 + 04 all DONE & MERGED.** CI green on every chantier merge into `main`. M1 80% through (4 of 5 chantiers).

### main now has

```
ae07739 feat: chantier 04 — kiosk mode (Electron Assaut + RN scaffolds + Kotlin Screen Pinning) (#8)
69d11b5 docs: mark chantier 03 fully shipped, brief chantier 04 (#7)
d415be4 feat: chantier 03 — local NUC server (Express + WS + SQLite + Zod) (#6)
f67e428 chore(deps): bump the actions group with 3 updates (#4)
952fd20 docs: mark chantier 02 fully shipped, brief chantier 03 (#5)
35fde9a feat: chantier 02 — CI pipeline + Vitest at root (#3)
b2218aa refactor: chantier 01 quality-gate review fixes (#2)
86e2d91 chore: scaffold monorepo (chantier 01) (#1)
a92df49 chore: initial bundle (CLAUDE.md, docs, rules)
```

### Chantier 04 deliverables (PR #8)

- **`apps/assaut`** — Electron 41 + Vite + React 18 + TypeScript via `electron-vite`. Triple-verrou kiosk lock: BrowserWindow flags (`kiosk:true, fullscreen:true, frame:false, contextIsolation:true, nodeIntegration:false, sandbox:true, webSecurity:true, devTools:!isProduction`), `globalShortcut.register` for Alt+Tab/Alt+F4/Ctrl+Esc/Win+L/Win+D/Ctrl+Shift+Esc with failed-shortcut tracking, single-instance lock at module load, `will-navigate` origin+pathname compare, `will-attach-webview` deny, popup deny, no-sourcemaps in main/preload, no menu, single-instance lock. Typed Zod IPC via `src/shared/ipc.ts` + preload `contextBridge`. Placeholder « Section 13 » UI with kiosk-status footer (will be deleted post-validation per the refactoring agent). README points at `.claude/rules/assaut.md` and the inline source for kiosk caveats; Ctrl+Alt+Del / Win+L documented as kernel-level non-blockable.
- **`apps/attaque-de-bots`** + **`apps/debriefing`** — RN 0.85 + React 19 scaffolds (no Expo). Workspace-aware Metro config with explicit `blockList` for workspace-root + sibling-app `node_modules` (cold start ~4 s vs ~20 s without). `src/App.tsx` placeholders ("Connexion équipe" + "Débriefing"), hardware Back swallowed at root (`BackHandler` returns `true`; TODO inline for chantier 05's React Navigation refactor). `src/kiosk.ts` TS façade over the Kotlin module, throws typed `KioskNotAvailableError`. `KioskModule.kt` + `KioskPackage.kt` per-app under their respective `com.coderouge.{attaquedebots,debriefing}` packages — wraps `Activity.startLockTask()` (Android Screen Pinning), null-activity guard, UI-thread dispatch, surfaces `SecurityException` with the exact "enable in Settings → Security → Screen Pinning" guidance.
- **What's NOT committed for the RN apps** (intentionally — needs `npx @react-native-community/cli init` to generate, then a follow-up PR): `android/build.gradle`, `android/app/build.gradle`, `gradle/wrapper/`, `MainActivity.kt`, `MainApplication.kt`, `AndroidManifest.xml`, `res/`. Both READMEs document the exact CLI incantation, applicationId substitution, and the `MainApplication.kt` line registering `KioskPackage()`.

### Chantier 04 ACs verified

- ✅ `pnpm typecheck` → 7/7 packages, including both RN apps + assaut's composite project refs
- ✅ `pnpm -r run lint` → exit 0
- ✅ `pnpm test` → 16/16 pass
- ✅ `pnpm --filter assaut build` → main 4.6 kB, preload 0.83 kB, renderer 217 KB
- ✅ `shellcheck tools/scripts/*.sh` → exit 0
- ✅ `pnpm audit --audit-level=high` → exit 0 (3 moderate, 0 high)
- ✅ CI on main run → 5/5 green
- ⏸ **Hardware verification still required:** `pnpm dev --filter assaut` (would lock dev machine — Georges to run manually); `pnpm android --filter @code-rouge/<rn-app>` (needs RN-CLI scaffold + connected device); `adb shell dumpsys activity | grep "Lock Task"` shows LOCKED.

### Quality gate (5 agents in parallel) — 22 findings, 19 applied pre-merge, 3 deferred to chantier 04 follow-up or chantier 05

P0: removed `alwaysOnTop:true` (kiosk multi-monitor risk), removed redundant `aria-label` (label-name divergence trap), added visible focus ring (was outline:none with subtle border swap).

P1: single-instance lock hoisted before `whenReady()` (race), `will-navigate` origin+pathname compare (was strict equality, both blocked Vite HMR and would have allowed `?injected=payload`), CSP `connect-src ws: wss:` (chantier 05 WS would silently fail), failed-shortcut tracking via IPC (Win+L kernel-intercepted; demo footer would have shown wrong count), `devTools: !isProduction`, `webSecurity: true` explicit, `will-attach-webview` deny, `sourcemap: false` for main+preload, `AppVersionResponse` trimmed to `{ app }` only (no Electron-version fingerprinting), color contrast tuned (--accent 3.2:1→4.8:1, --muted 3.06:1→5.5:1, error 3.75:1→5.9:1 — all pass WCAG AA Normal-Text), ✓ prefix on "kiosk mode active" status (consistent with ⚠ on errors; non-color cue), collapsed dead `KioskNotAvailableError` catch arm (instanceof Error covers it), inline TODO for BackHandler-vs-Navigation refactor.

P2: Metro `blockList` (perf agent applied during the run), assaut README triple-verrou block trimmed (~70 lines, was duplicating `.claude/rules/assaut.md`), attaque-de-bots README "No Expo modules" line removed (also duplicate of rules).

**Plus a CI fix-on-PR:** `pnpm audit --audit-level=high` (added in chantier 02) caught 4 high CVEs in `tar` (via electron-builder's transitive chain) + 4 high CVEs in Electron 33. Resolved by removing the prematurely-added `electron-builder` (packaging belongs to chantier 05) and bumping `electron@^33.4.11 → ^41.3.0`. The audit step is now actively earning its place in CI.

**Deferred:**
- BackHandler refactor for React Navigation (chantier 05; inline TODO in both RN App.tsx files)
- `KioskModule.kt` `BuildConfig.DEBUG`-gated error message (production must not leak the Settings path) — needs Android Studio scaffold to generate `BuildConfig`; will land alongside the chantier 04 follow-up PR
- Native `MainActivity.onCreate.startLockTask` (eliminates ~100-300ms placeholder visible before pinning engages) — chantier 05 hardening once `MainActivity.kt` exists

---

## Currently in progress

_(none — chantier 04 done, awaiting next session for chantier 05)_

---

## Blocked / waiting on Georges

- **Hardware validation for chantier 04:** the kiosk runtime ACs cannot be fully verified without a Windows mallette PC + an Android tablet/emulator + Android Studio. Code is complete; these need the machines.
- **Android scaffold follow-up PR:** before chantier 05's persistence demo can run on hardware, someone needs to run the `npx @react-native-community/cli init` flow per `apps/attaque-de-bots/README.md` (and same for debriefing) to generate the missing `android/` Gradle tree, then commit the result. Should be a small PR labelled `chantier 04 follow-up — Android scaffold`.

## Notes (non-blocking)

- **3 moderate** transitive vulnerabilities still in `pnpm audit` (none high). Below the CI threshold; worth a triage when convenient.
- Vercel session hooks continue to fire on common filenames; ignored.
- The kiosk-status footer in `assaut/App.tsx` is debugging UI for the M1 demo and is **scheduled for deletion after the 4-May validation visio** — including the `IpcChannel.KioskStatus` path in `shared/ipc.ts` (refactoring agent's recommendation in PR #8). `IpcChannel.AppVersion` stays — chantier 05 needs it for the GM session-reset flow.

---

## Next concrete task

**Chantier 05 — Persistance & reprise automatique** (`docs/m1-plan.md` § Chantier 05).

**Day:** J5 — Mon 4 May 2026 (morning) ; **demo to Nathanael at 14h30**.

**Branch:** `feat/chantier-05-persistence`.

In order:
1. **5.1** — Local state store (RN apps). `@react-native-async-storage/async-storage` in both `attaque-de-bots` + `debriefing`. `useGameState()` hook wraps `(state, setState)`, persists on every change, rehydrates on boot before first render. Persisted: `teamId`, `currentStep`, `score`, `lastSync`. **AC:** force-stop the app via `adb shell am force-stop`, reopen, lands on the same step with no flash of team-selection.
2. **5.2** — Local state store (Electron Assaut). `electron-store` (or typed JSON in `app.getPath('userData')`). Same shape + behaviour as 5.1. Main process loads sync at startup, passes to renderer via initial IPC handshake. **AC:** type a code, force-kill via Task Manager (kiosk blocks the rest), reopen — code still in input.
3. **5.3** — Server-side resume on connect. On `HelloMessage`: lookup `(teamId, app)` in `team_state`, send back a `RestoreMessage` if found. App reconciles (server authoritative for cross-app fields like `teamId`; app authoritative for its own UI step). **AC:** wipe a tablet's local storage, reconnect — server-driven restore lands on last-known step without team-select.
4. **5.4** — `tools/scripts/demo-persistence.sh` automating the validation scenario. Screenshots in `docs/demo/m1/`. **AC:** script runs end-to-end except for the manual Windows-PC reboot.

**Heads-up specific to chantier 05:**
- **BackHandler refactor:** when React Navigation lands, change `BackHandler.addEventListener('hardwareBackPress', () => true)` to `() => !navigationRef.current?.canGoBack()` in both RN App.tsx files. Inline TODO is in place.
- **WebSocket reconnect cap:** the perf agent flagged this as a chantier-05 trap. Cap exponential backoff at 30 s (`Math.min(delay, 30_000)`); without it, a tablet that disconnects at minute 5 ends up offline for the rest of the 60-min session.
- **AsyncStorage / electron-store reads:** wrap behind a single `useEffect` → context, never call from inside frequently-rendered components.
- **better-sqlite3 + `synchronous = FULL`** is already set (chantier 03) so the force-reboot demo's WAL durability is covered.
- **Missing Server→App message types:** `RestoreMessage` schema exists in `packages/shared-types/src/messages.ts` but no server code emits it yet. Wire it up in 5.3.
- **Per-package test footgun**: still closed. Don't add `test` scripts at the package level — root `pnpm test` finds tests via Vitest config.
- **Kiosk-status footer in assaut** can be deleted post-validation, per the refactoring agent's note in PR #8 description and in this CONTEXT.md.

**Standing instructions (in memory):**
- At chantier-05-end, run code-reviewer + security-auditor + performance-optimizer + refactoring-specialist + qa-tester (the m1-plan calls out 5.x as the highest-leverage area for unit tests in the project — Nathanael will demo to clients) quality gates before opening the PR. Apply P1 findings on the same branch.
- Merge green PRs (including Dependabot) without prompting.
- After 5.4 lands and the M1 demo passes, **tag `v0.1.0`** per `CLAUDE.md` § Tags.

---

## Format for future updates

When you update this file, replace the section bodies above. Keep the
section headers as-is. Be specific:

**Good entry**
```
## Last session (2026-05-04)
- Completed Chantier 05: persistence works on both RN and Electron apps,
  server-side resume on Hello, demo-persistence.sh runs end-to-end.
- All 5 demo steps passed in front of Nathanael at 14h30.
- Tagged v0.1.0. M1 validated, invoicing tomorrow.
- Pushed: PR #N, merged squash to main as <sha>.
```

**Bad entry**
```
## Last session
- Did some setup. Things are progressing.
```

The bad version is useless next session. Be a future-you who has zero memory
of today.
