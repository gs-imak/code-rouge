# Code Rouge

> Applications joueurs E2/E3 + mini-app Débriefing pour **« Code Rouge »**,
> escape game B2B nomade par **The Game**.

Monorepo containing four runtime artifacts:

- **Attaque de Bots** — React Native, Android tablet (Espace 2)
- **Assaut** — Electron + React, Windows PC mallette (Espace 3)
- **Débriefing** — React Native, Android smartphone (Game Master)
- **Server NUC** — Node.js + WebSocket + SQLite, Intel NUC

## Prerequisites

- Node 22 LTS
- pnpm 9+
- Git
- GitHub CLI (`gh`) — for repo operations
- Android Studio + an Android tablet/emulator — for the RN apps
- Windows machine — for the Electron app's final builds (CI handles dev builds)

## Setup

```bash
pnpm install
pnpm typecheck
pnpm test
```

## Common commands

```bash
pnpm dev                      # all packages in watch mode
pnpm dev --filter assaut      # one app
pnpm typecheck                # tsc across the workspace
pnpm lint                     # eslint
pnpm test                     # vitest
pnpm build                    # production builds
```

## Documentation

- [`CLAUDE.md`](./CLAUDE.md) — project memory, conventions, immutable rules
- [`docs/architecture.md`](./docs/architecture.md) — technical decisions
- [`docs/m1-plan.md`](./docs/m1-plan.md) — active milestone plan
- [`docs/glossary.md`](./docs/glossary.md) — vocabulary

## Status

**Active milestone:** M1 — Socle technique (28 avr → 4 mai 2026).
See [`docs/m1-plan.md`](./docs/m1-plan.md).
