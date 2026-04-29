# Session Context

> **Read this first at the start of every session.**
> Update this file at the end of every session.

---

## Last session (2026-04-29)

**Bootstrap + Chantier 01 — Monorepo & design system skeleton — DONE.**

- Initialized git repo, created remote `gs-imak/code-rouge` (private) on GitHub.
- Two commits on branch `feat/bootstrap-chantier-01`:
  - `a92df49` `chore: initial bundle (CLAUDE.md, docs, rules)`
  - `3dcf163` `chore: scaffold monorepo (chantier 01)`
- Default branch `main` initialized at `a92df49` (initial bundle only); scaffold landed on the feature branch and is pending merge via PR.
- **PR open:** https://github.com/gs-imak/code-rouge/pull/1 — needs Georges to merge.
- Files added in scaffold commit:
  - Root: `package.json`, `pnpm-workspace.yaml`, `.npmrc` (`node-linker=hoisted`, `shamefully-hoist=true`), `turbo.json`, `tsconfig.base.json`, `tsconfig.json`, `.eslintrc.cjs`, `.eslintignore`, `.prettierrc`, `.prettierignore`, `.gitattributes` (enforces LF for cross-platform — NUC is Linux), `pnpm-lock.yaml`.
  - 4 apps + 3 packages, each with `package.json` (private, `@code-rouge/*`, scripts: `lint`/`typecheck`/`test`), `tsconfig.json` extending `../../tsconfig.base.json`, and `src/index.ts` (`export {}`).
- Root dev deps: `turbo@^2.3.3`, `typescript@^5.9.3`, `eslint@^8.57.1`, `@typescript-eslint/{eslint-plugin,parser}@^8.59`, `eslint-plugin-react@^7.37.5`, `eslint-plugin-react-hooks@^5.2.0`, `eslint-config-prettier@^9.1.2`, `prettier@^3.8.3`, `@types/node@^22.10.2`.
- All chantier 01 ACs verified empirically:
  - `pnpm install` clean ✓ (also from a fresh clone)
  - `pnpm typecheck` 7/7 successful ✓
  - `pnpm -r exec tsc --noEmit` exit 0 ✓
  - `pnpm -r run lint` exit 0 ✓
  - `pnpm exec tsc --noEmit -p tsconfig.base.json` exit 0 ✓
  - ESLint warns on `let x: any = 1;` ✓
  - `pnpm -r ls --depth=-1` shows the 7 workspace members ✓

---

## Currently in progress

_(none — chantier 01 done, awaiting PR merge)_

---

## Blocked / waiting on Georges

- **PR #1 needs review/merge** to land scaffold on `main`. Direct push to `main` is blocked by local permission rules; the agent created the repo's `main` ref at the initial bundle commit and routed the scaffold work through a feature branch + PR per the project's `feat/<slug>` convention.
- **Node 22 LTS expected, dev machine has Node v24.14.1.** The tooling all worked under Node 24 for chantier 01's structural work (no runtime apps yet), and CLAUDE.md only mandates Node 22 strictly for the NUC server (chantier 03+). Confirm whether Georges wants to switch to Node 22 LTS locally before chantier 03 (the server runs on Node 22 in production).
- **Vercel-related session hooks fired repeatedly** for `package.json`, `tsconfig.*.json`, `pnpm-workspace.yaml`. Ignored — this project is offline-only by spec (no Vercel, no Next.js). Not a blocker, but worth noting if hooks need disabling locally.

---

## Next concrete task

**Chantier 02 — Pipeline d'intégration continue** (`docs/m1-plan.md` § Chantier 02).

In order:
1. **2.1** — `.github/workflows/ci.yml`: jobs `lint`, `typecheck`, `test`, `build-android`, `build-windows`. Use `actions/setup-node@v4` (Node 22), `pnpm/action-setup@v3` (pnpm 9), `actions/cache@v4` for the pnpm store. Trigger on `push` (any branch) + `pull_request`.
2. **2.3** (do before 2.2 so the `test` job has something to run) — install `vitest` + `@vitest/coverage-v8` at the root, add `vitest.config.ts` finding tests under `apps/**` and `packages/**`, write one trivial passing test in `packages/shared-utils/src/index.test.ts`. Wire `pnpm test` to Vitest in CI mode.
3. **2.2** — once CI is green on `main`, add the green-build badge to `README.md`.

Acceptance: a push to `main` triggers a run with all jobs green, second run shows pnpm-store cache hit, badge renders green.

**Branch name:** `feat/chantier-02-ci`.

---

## Format for future updates

When you update this file, replace the section bodies above. Keep the
section headers as-is. Be specific:

**Good entry**
```
## Last session (2026-04-30)
- Completed Chantier 01: scaffolded monorepo, all workspace members
  declared, tsconfig.base.json + ESLint + Prettier root configs done.
- Pushed: a3f12b8 "chore: scaffold monorepo"
- All 4 apps/* and 3 packages/* directories exist with package.json stubs.
- pnpm typecheck passes (0 errors).
```

**Bad entry**
```
## Last session
- Did some setup. Things are progressing.
```

The bad version is useless next session. Be a future-you who has zero memory
of today.
