# Session Context

> **Read this first at the start of every session.**
> Update this file at the end of every session.

---

## Last session (2026-04-29) — **M1 SHIPPED, tagged `v0.1.0`**

All 5 chantiers of M1 done and merged. CI green on every chantier merge into `main`. **Demo to Nathanael: 2026-05-04 14h30.**

### main now has

```
c2effad feat: chantier 05 — persistence + server-side restore + demo script (M1 final) (#10)
3125990 docs: mark chantier 04 fully shipped, brief chantier 05 (M1 demo) (#9)
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

**Tag: `v0.1.0` (signed annotated, pushed to origin).**

### Chantier 05 deliverables (PR #10)

- **`packages/shared-types`**: `GameState` Zod schema (deviceId / teamId / currentStep / score / lastSync / draftAuthCode), `reconcile(local, restoreMsg)` with documented authority policy (server wins teamId; app wins step+score when past 'init', with `Math.max` on score to prevent regression).
- **`packages/shared-utils`**: capped exponential backoff (`nextBackoffDelay`, ±20% jitter, 30 s cap), `createWsClient` reconnecting WebSocket consumed by all 3 apps, `randomDeviceId` (crypto.randomUUID, throws on missing — Math.random fallback removed in P0 review fix).
- **`apps/server-nuc`**: `db.getTeamStateByDevice(sessionId, deviceId, app)` session-scoped restore lookup + `002_device_id_index.sql` covering index + per-IP WS connection rate limit (10/10s, 429 before `handleUpgrade`). Hello handler emits Welcome AND Restore in one round-trip.
- **`apps/attaque-de-bots`** + **`apps/debriefing`**: AsyncStorage-backed `useGameState` hook with rehydration-gated first paint, deviceId minted on first boot. Attaque-de-bots also wires `useServerSync` (Hello on open, Restore → reconcile, manual `pushState` on transitions) and a green/yellow/red diagnostic dot.
- **`apps/assaut`**: electron-store-backed `useGameState` via Zod-validated `GetGameState` / `SetGameState` IPC channels. Renderer's auth-code input is now controlled by `state.draftAuthCode` and persists per keystroke. IPC handler uses `safeParse` + explicit Error; renderer catches IPC rejections and reverts the optimistic local state.
- **`tools/scripts/demo-persistence.sh`** + **`demo-ws-roundtrip.mjs`**: orchestrator + standalone Node WS round-trip. Refuses non-local SERVER_HOST. Phase 2 honestly labelled as "post-force-stop, deviceId stable" (not "post-wipe" — the latter requires hardware-derived IDs landing in chantier 06+).

### Chantier 05 ACs verified

- ✅ `pnpm typecheck` → 7/7 (full turbo cache hit)
- ✅ `pnpm test` → **37/37 pass** (was 23 — added 14 tests this chantier: 8 GameState/reconcile + 4 device-id + previously 2 round-trip)
- ✅ `pnpm -r run lint` → exit 0
- ✅ `pnpm audit --audit-level=high` → exit 0 (3 moderate, 0 high)
- ✅ `bash tools/scripts/demo-persistence.sh` → exit 0 (live round-trip against tsx-run server, session-scoped restore + per-IP rate limit + 002 index applied)
- ✅ CI on main run → 5/5 green
- ⏸ **Hardware-only:** force-stop the tablet → reopen → no flash, lands on team's last step; type a code in Assaut → Task-Manager-kill → reopen, code preserved; demo script's manual block (3a–3e: kiosk launch, network diagnostic, team selection, force-reboot, CI badge).

### Quality gate (5 agents in parallel) — 11 fixes + 12 tests baked in

P0: IPC `SetGameState` safeParse + renderer revert-on-reject (silently dropped writes were possible); `randomDeviceId` Math.random fallback removed (was dead code on every target runtime AND produced predictable UUIDs an on-LAN sniff could narrow); demo script honest AC labelling + non-local SERVER_HOST refusal.

P1: `002_device_id_index.sql` migration; `getTeamStateByDevice` session-scoped (closes cross-session deviceId leak — sniff one team's deviceId off the LAN and you'd get their prior-day progress); per-IP WS connection rate limit (10/10s, 429 before handleUpgrade); `useGameState.getLatest()` exposed and used by all event handlers (closes the double-tap race); `reconcile` takes `Math.max(local.score, restore.score)` on the local-progressed branch (no visible score regression on reboot).

Tests: extended `messages.test.ts` with 10 new tests covering `GameState` defaults, `DEFAULT_GAME_STATE`/Zod-default sync, `currentStep min(1)` rejection, full `reconcile` branch coverage; new `device-id.test.ts` with 4 tests including the throw-on-missing-crypto path (locks in the P0 fix).

### Deferred (chantier 06+, with concrete plans)

- NUC-IP-scoped CSP (chantier 06's GM admin screen derives `connect-src` from configured NUC IP)
- pino `redact: ['*.draftAuthCode']` (preemptive — once chantier 06 wires real auth, never log the field even at debug)
- Demo script: fresh-UUID-per-run + server-side cleanup endpoint
- Native `MainActivity.onCreate.startLockTask` (eliminates ~100-300 ms placeholder visible before pinning) — needs Android Studio scaffold first
- BackHandler refactor for React Navigation
- Hardware-derived device IDs (Android `Settings.Secure.ANDROID_ID` + Windows machine GUID) so the chantier 05.3 AC works with full storage wipe, not just force-stop

---

## Currently in progress

_(none — M1 done, awaiting hardware validation + 4 May visio with Nathanael)_

---

## Blocked / waiting on Georges

- **Hardware validation for chantier 04 + 05:** runtime ACs need a Windows mallette PC + an Android tablet/emulator + Android Studio. Code is complete.
- **Android scaffold follow-up PR:** `npx @react-native-community/cli init` walkthrough in `apps/attaque-de-bots/README.md` + `apps/debriefing/README.md`. Generates the `android/` Gradle tree the kiosk Kotlin sources land into. Should be a small standalone PR before the demo.

## Notes (non-blocking)

- 3 moderate vulnerabilities still in `pnpm audit` (none high). Below the CI threshold; worth a triage when convenient.
- Vercel session hooks continue to fire; ignored.
- Kiosk-status footer in `assaut/App.tsx` is debugging UI for the M1 demo — **scheduled for deletion after the 4-May validation visio** (refactoring agent's recommendation in PR #8).

---

## Next concrete task

**M1 demo with Nathanael — 2026-05-04 14h30.** Walk through the 5-step validation scenario from `docs/m1-plan.md` § Validation. Run `tools/scripts/demo-persistence.sh` for the automatable steps; complete steps 3a-3e by hand on the venue hardware (mallette + tablet + GM phone).

After demo passes:
1. Capture screenshots into `docs/demo/m1/` (the directory has a `.gitkeep`; PNGs are gitignored by default).
2. Open the **chantier 04 follow-up PR** generating the `android/` Gradle scaffold for both RN apps.
3. Delete the kiosk-status footer in `assaut/App.tsx` + the `IpcChannel.KioskStatus` IPC path (no longer needed; `IpcChannel.AppVersion` stays — chantier 06+ session reset uses it).
4. **Send invoice for M1.**

If demo finds blocking bugs, branch `fix/m1-demo-<short-slug>` per chantier and apply the same flow (PR + quality gate + merge). Treat any hardware-only AC failures as separate chantier-06 prep issues, not M1 regressions, unless they materially block validation.

**Once M1 is signed off → chantier 06 starts: real game content (parcours JSON, mailbox JSON, énigme matrices A/B/C/D, CDC sequence linéaire for Assaut) + the design-system tokens once the graphiste's maquettes land.**

---

## Format for future updates

When you update this file, replace the section bodies above. Keep the
section headers as-is. Be specific:

**Good entry**
```
## Last session (2026-05-04)
- M1 demo passed; Nathanael signed off. Tagged v0.1.0 already; invoice
  drafted, sent to Nathanael CC accounting.
- Captured 4 PNGs in docs/demo/m1/.
- Found one regression during demo: shared-types `reconcile` returned
  draftAuthCode='' instead of preserving when local was past init —
  fixed in PR #11, merged.
- Chantier 04 follow-up Android scaffold landed in PR #12.
- Next: chantier 06 — game content (parcours.json schema first).
```

**Bad entry**
```
## Last session
- Did some setup. Things are progressing.
```

The bad version is useless next session. Be a future-you who has zero memory
of today.
