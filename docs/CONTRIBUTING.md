# Contributing to Code Rouge

Engineering conventions, build commands, and load-bearing rules for everyone working on this repo.

## Project layout

This is a **pnpm + Turborepo monorepo**:

```
apps/
  attaque-de-bots/   # React Native, Android tablet 10"
  assaut/            # Electron + React, Windows PC mallette
  debriefing/        # React Native, Android smartphone
  server-nuc/        # Node.js + ws + better-sqlite3, Intel NUC
packages/
  design-system/     # Shared tokens, components, theme
  shared-types/      # WebSocket message schemas, JSON config types
  shared-utils/      # Persistence helpers, date, network probes
tools/scripts/       # NUC install scripts, dev utilities
docs/
  architecture.md    # Technical decisions, decision log
  m1-plan.md         # Milestone plan
  glossary.md        # Vocabulary
  conventions/       # Per-app engineering conventions
  CONTRIBUTING.md    # This file
```

The active milestone plan lives in [`m1-plan.md`](./m1-plan.md). Read it before picking up a task.

## Tech stack — non-negotiable

- **TypeScript strict everywhere** (`"strict": true`, `"noUncheckedIndexedAccess": true`)
- **Node 22 LTS**, pnpm 9+, Turborepo
- **React Native** for Android (latest stable, expects pnpm `node-linker=hoisted`)
- **Electron + React** for Windows
- **ws + better-sqlite3 + express** on the NUC server
- **Vitest** for unit tests, Playwright for any E2E later
- **ESLint + Prettier**, configured at the root and inherited

## Conventions

- **Commits**: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `ci:`)
- **Branches**: `main` is always green. Feature work on `feat/<short-slug>`. Squash-merge.
- **PRs**: Required for any change touching the kiosk lock or load-bearing rules below. Optional otherwise during M1.
- **Tags**: Each milestone validated → tag `v0.<milestone>.0` (M1 → `v0.1.0`).
- **File naming**: `kebab-case` for files, `PascalCase` for components, `camelCase` for functions.
- **No default exports** in shared packages (named only).
- **No `any`** without an inline `// eslint-disable-next-line` and a one-line justification.

## Build & test commands

```bash
pnpm install                  # bootstraps the workspace
pnpm dev                      # turbo dev for all packages
pnpm dev --filter assaut      # one app
pnpm typecheck                # tsc --noEmit across all packages
pnpm lint                     # eslint
pnpm test                     # vitest
pnpm build                    # production builds
pnpm build:android            # APK for the two RN apps
pnpm build:windows            # exe for assaut
```

## Load-bearing rules (require manual review on any change)

1. **Kiosk lock is sacred.** Any change to kiosk mode (Screen Pinning on Android, Electron `kiosk:true` + low-level hooks on Windows) requires manual review. Never bypass it for "convenience" even in dev. The lock is gated on `app.isPackaged` so dev mode runs windowed; production keeps the full triple verrou.
2. **Architecture is data-driven.** Texts, timings, media paths, énigme matrices live in JSON config files under `packages/shared-types/configs/` (or per-app `assets/config/`). Never hardcode game content in components.
3. **All media is local.** No network fetches for images, sounds, videos at runtime. Use placeholders (solid color SVG, silent mp3, 1s black mp4) until final assets land. Define placeholder paths in config.
4. **Persistence is mandatory.** Every app saves its state on every meaningful transition. On boot, restore last state if present. Tested by killing the process mid-flow.
5. **WebSocket is for low-volume sync.** Do not stream media or high-frequency events over WebSocket. Per-frame state is local.
6. **No telemetry, no analytics, no external HTTP calls** at runtime. Game runs offline. CI may reach the internet for builds; the apps must not.
7. **Never delete files in `apps/<app>/assets/placeholders/`** without confirmation — they're the fallback when final media is late.

## Per-app conventions

App-specific engineering rules (kiosk specifics, performance budgets, target hardware) live under [`docs/conventions/`](./conventions/):

- [`docs/conventions/assaut.md`](./conventions/assaut.md) — Electron + React Windows app
- [`docs/conventions/attaque-de-bots.md`](./conventions/attaque-de-bots.md) — RN Android tablet
- [`docs/conventions/debriefing.md`](./conventions/debriefing.md) — RN Android smartphone (Game Master)
- [`docs/conventions/server-nuc.md`](./conventions/server-nuc.md) — Node.js NUC server

## When you don't know something

- **Tech stack questions** → [`docs/architecture.md`](./architecture.md)
- **French domain term** → [`docs/glossary.md`](./glossary.md)
- **Active milestone scope + acceptance criteria** → [`docs/m1-plan.md`](./m1-plan.md)
- **App-specific specifics** → [`docs/conventions/<app>.md`](./conventions/)

## Project scope (what this is and isn't)

- One game, twelve teams per session, one location, one Game Master.
- Not a SaaS, not multi-tenant, not user-account-based.
- Not networked beyond the local Wi-Fi mesh.
- Not a place to try experimental dependencies. Choose boring, mature libraries.
- UX/UI is delivered by an external graphiste. Maquettes are integrated, not redesigned.

## Localization

- Code, comments, commits, and internal docs: **English**.
- Client-facing copy (in-app text, handoff docs, validation guides): **French**.
