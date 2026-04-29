# Code Rouge — Project Memory

You are working on **« Code Rouge »**, a B2B nomadic escape game by The Game.
The deliverable is **three player applications + one local server**, all running
**100% offline** on a private Wi-Fi network.

## Project structure

This is a **pnpm + Turborepo monorepo**. Layout:

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
docs/                # m1-plan.md, architecture.md, glossary.md
.claude/rules/       # Path-scoped rules per app — auto-loaded by path
```

**Always read `docs/m1-plan.md` before picking up a new task.** It contains
the active milestone scope, ordered tasks, and acceptance criteria.

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
- **PRs**: Optional during M1 (solo dev). Direct push to `main` is fine if CI passes.
- **Tags**: Each milestone validated → tag `v0.<milestone>.0` (M1 → `v0.1.0`).
- **File naming**: `kebab-case` for files, `PascalCase` for components, `camelCase` for functions.
- **No default exports** in shared packages (named only).
- **No `any`** without an inline `// eslint-disable-next-line` and a one-line justification.

## Build & test commands (use these, not improvised ones)

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

## Immutable rules

1. **The kiosk lock is sacred.** Any change to kiosk mode (Screen Pinning on
   Android, Electron `kiosk:true` + low-level hooks on Windows) requires a
   manual review from the human operator. Never bypass it for "convenience"
   even in dev.
2. **Architecture is data-driven.** Texts, timings, media paths, énigme
   matrices live in JSON config files under `packages/shared-types/configs/`
   (or per-app `assets/config/`). **Never hardcode game content in components.**
3. **All media is local.** No network fetches for images, sounds, videos at
   runtime. Use placeholders (solid color SVG, silent mp3, 1s black mp4) until
   final assets land. Define placeholder paths in config.
4. **Persistence is mandatory from day 1.** Every app saves its state on every
   meaningful transition. On boot, restore last state if present. Tested by
   killing the process mid-flow.
5. **WebSocket is for low-volume, end-of-session sync.** Do not stream media
   or high-frequency events over WebSocket. Per-frame state is local.
6. **No telemetry, no analytics, no external HTTP calls** at runtime. Game
   runs offline. CI may reach the internet for builds; the apps must not.
7. **Never delete files in `apps/<app>/assets/placeholders/`** without
   confirming with the human — they're the fallback when final media is late.

## Active milestone

**M1 — Socle technique** | 28 avr → 4 mai 2026 | Validation visio le 4 mai 14h30.

The milestone scope, day-by-day plan, and acceptance criteria are in
`docs/m1-plan.md`. **Refuse to work on M2/M3 features before M1 is validated.**
If the human asks for an M2 feature ("add a puzzle"), point them to
`docs/m1-plan.md` and ask if they want to defer it or change the milestone scope.

## Session handoff

At the **end of every working session**, update `CONTEXT.md` with:
1. What was completed today (specific file paths, function names)
2. What's in progress (branch, where it stopped)
3. Anything blocked or waiting on the human (decisions, assets, hardware)
4. Next concrete task to pick up

At the **start of every session**, read `CONTEXT.md` first.

## When you don't know something

- **Tech stack questions** → `docs/architecture.md`
- **Plain-French translation of a term** → `docs/glossary.md`
- **App-specific rules** → `.claude/rules/<app>.md` (auto-loaded by path)
- **Stop and ask** before making a decision that affects the kiosk, the
  persistence model, the WebSocket protocol, or the data-driven config schema.
  These are load-bearing.

## What this project is **not**

- Not a SaaS, not multi-tenant, not user-account-based. One game, twelve teams, one location, one game master.
- Not networked beyond the local Wi-Fi mesh.
- Not a place to try experimental dependencies. Choose boring, mature libraries.
- Not your project to redesign. UX/UI is delivered by an external graphiste.
  You integrate maquettes, you do not redesign them.

## The client

Nathanael Masson is the founder of **The Game**. He's not technical. The
prestataire (you, via the human) is **Georges**, a freelance full-stack dev.
All client-facing copy stays in **French**. Code, comments, commits, and
docs are in **English**.
