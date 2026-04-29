# Session Context

> **Read this first at the start of every session.**
> Update this file at the end of every session.

---

## Last session (2026-04-29)

**Bootstrap + Chantier 01 + Chantier 02 — DONE & MERGED. CI green on main.**

### main now has

```
35fde9a feat: chantier 02 — CI pipeline + Vitest at root (#3)
b2218aa refactor: chantier 01 quality-gate review fixes (#2)
86e2d91 chore: scaffold monorepo (chantier 01) (#1)
a92df49 chore: initial bundle (CLAUDE.md, docs, rules)
```

### Chantier 02 deliverables (PR #3)

- `.github/workflows/ci.yml` — 5 jobs (lint, typecheck, test, build-android, build-windows) on Node 24 / pnpm 10 / ubuntu-latest. `permissions: contents: read`, concurrency cancels stale runs, `defaults.run.shell: bash`, `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true`.
- Triggers: `on: push: { branches: [main] }` + `on: pull_request:` (no duplicate runs on PR pushes).
- `pnpm audit --audit-level=high` step in test job. Currently 2 moderate, 0 high — passes.
- pnpm-store cache via `actions/setup-node@v4` keyed on `pnpm-lock.yaml` — cache hit confirmed on run #2.
- `vitest.config.ts` at root finds tests under `apps/**` and `packages/**`. `@vitest/coverage-v8` for coverage.
- One trivial passing test: `packages/shared-utils/src/index.test.ts`.
- Root `pnpm test` → `vitest run` (single process). Per-package `test` scripts removed across all 7 packages — closes the footgun where `pnpm --filter X test` would silently run the whole suite.
- `tools/scripts/build-android.sh` + `tools/scripts/build-windows.sh` (chmod +x, exit 0 stubs). `package.json` `build:android`/`build:windows` invoke them. Chantier 04 will edit only the script files.
- `.github/dependabot.yml` — weekly grouped github-actions ecosystem updates.
- README CI badge: `[![CI](...badge.svg?branch=main)](...)` — renders green now.
- `engines.node: ">=24.0.0"` (was `>=22.0.0`) — matches the Node 24 LTS decision.

### Chantier 02 ACs verified empirically

- ✅ Push to `main` triggers a run, all 5 jobs green — run [25120907988](https://github.com/gs-imak/code-rouge/actions/runs/25120907988) (post-merge on main)
- ✅ Cache hit on second run — `Cache restored from key: node-cache-Linux-x64-pnpm-135377...`
- ✅ Badge renders green
- ✅ `pnpm test` 1/1 pass locally
- ✅ CI test job green (with `pnpm audit --audit-level=high` passing)
- ✅ `pnpm --filter @code-rouge/shared-utils test` errors with "Lifecycle script `test` not defined" (footgun closed)

### Quality-gate review (4 agents in parallel)

- **devops** — flagged duplicate-run trigger, missing `defaults.run.shell`, deprecation annotation, future-proofing for build-windows runner switch and Java/Android SDK
- **security-auditor** — confirmed `permissions: contents: read` is sufficient (private repo + no secrets yet); added `pnpm audit` step + dependabot; SHA-pinning + signing-job gating deferred to chantier 04 with concrete YAML
- **code-reviewer** — flagged the per-package `test` script footgun, `engines.node`/README mismatch
- **refactoring-specialist** — vitest exclude redundancy, dead `outputs` on turbo test task, build-script extraction

All P1 + cheap P2 fixes applied in commit `0c5e6b5` on the same chantier branch before merge. Composite action / SHA-pinning / signing-job gating deferred to chantier 04.

---

## Currently in progress

_(none — chantier 02 done, awaiting next session for chantier 03)_

---

## Blocked / waiting on Georges

_(none)_

## Notes (non-blocking)

- **2 moderate vulnerabilities** in transitive deps (visible via `pnpm audit`). Below the High threshold so CI passes. Worth reviewing during chantier 03 prep — likely in dev tooling (eslint, vitest, or one of their deps). Not a blocker for the 4 May demo.
- **Vercel-related session hooks** continue to fire on common filenames (package.json, tsconfig, workflows). Ignored — project is offline-only by spec. Worth disabling locally if they get noisy.
- **Tools deferred for chantier 04** are all listed in PR #3 description: SHA-pin actions when keystore secrets land, composite setup action when `build-windows` switches to `windows-latest`, gate signing jobs to `push` on `main` only.

---

## Next concrete task

**Chantier 03 — Serveur local NUC** (`docs/m1-plan.md` § Chantier 03).

**Day:** J3 — Thu 30 April 2026.

**Branch:** `feat/chantier-03-server`.

In order:
1. **3.1** — `apps/server-nuc` ESM TypeScript project. Deps: `express`, `ws`, `better-sqlite3`, `zod`, `pino`, `pino-pretty` (dev). Dev deps: `tsx`, `@types/express`, `@types/ws`, `@types/better-sqlite3`. Scripts: `dev` (tsx watch), `build` (tsc), `start` (node dist). `src/index.ts` boots Express on `:8080`, WS on `/ws`, `GET /health` returns 200.
   - **AC:** `pnpm dev --filter @code-rouge/server-nuc` starts the server. `curl http://localhost:8080/health` returns 200. `wscat -c ws://localhost:8080/ws` connects.
2. **3.2** — `packages/shared-types/src/messages.ts`: Zod schemas for `HelloMessage`, `StateUpdateMessage`, `LogPushMessage`, `ServerCommandMessage`. Export `parseMessage(raw: string)` returning a discriminated union or throwing `MessageParseError`.
   - **AC:** typecheck passes for shared-types. Unit tests in `messages.test.ts`: valid hello round-trip, malformed JSON throws, unknown type throws.
3. **3.3** — SQLite persistence. `data/coderouge.sqlite` on first boot. `DATABASE_PATH` env var. `migrations/001_init.sql`: tables `sessions`, `team_state`, `event_log`. Upsert on `StateUpdateMessage`, append on `LogPushMessage`.
   - **AC:** wscat-driven state update visible in SQLite. Survives a restart.
4. **3.4** — `tools/scripts/install-nuc.sh`: Node 24 (NodeSource `setup_24.x`), clone, `pnpm install --prod`, build, systemd unit `code-rouge-server.service`, logs to `/var/log/code-rouge/`. `apps/server-nuc/README.md` documents the fresh-Ubuntu-LTS path.
   - **AC:** `shellcheck` clean. Dry-run reaches systemd-enable step without errors.

**Heads-up for chantier 03 specifically:**
- `better-sqlite3` is a native module — it'll trigger `node-gyp` build on `pnpm install`, adding ~30–60s the first time. CI's pnpm-store cache stores the prebuilt binary keyed on `runner.os` + lockfile.
- Server-nuc must bind to LAN interface only in production, never `0.0.0.0` (per `.claude/rules/server-nuc.md`).
- All inbound payloads validated by Zod **before** touching state — schemas live in `packages/shared-types`, never in the server.
- Synchronous better-sqlite3 API only — no async ORMs.
- Use `pino` structured logs, never string interpolation in the message.

**Standing instruction (in memory):** at end of chantier 03, run code-reviewer + security-auditor (Zod boundary, the `/admin/reset` endpoint, LAN binding) + performance-optimizer (SQLite query patterns + WS hot paths) + refactoring-specialist quality gates before opening the PR. Apply P1 findings on the same branch.

---

## Format for future updates

When you update this file, replace the section bodies above. Keep the
section headers as-is. Be specific:

**Good entry**
```
## Last session (2026-04-30)
- Completed Chantier 03: server-nuc booted, /health returns 200, WS handshake
  validated end-to-end, SQLite persists across restart.
- Pushed: PR #4, merged squash to main as <sha>.
- All M1 ACs for chantier 03 met empirically.
```

**Bad entry**
```
## Last session
- Did some setup. Things are progressing.
```

The bad version is useless next session. Be a future-you who has zero memory
of today.
