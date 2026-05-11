# Code Rouge

[![CI](https://github.com/gs-imak/code-rouge/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/gs-imak/code-rouge/actions/workflows/ci.yml)

> Applications joueurs E2/E3 + mini-app Débriefing pour **« Code Rouge »**,
> escape game B2B nomade par **The Game**.

Monorepo containing four runtime artifacts:

- **Attaque de Bots** — React Native, Android tablet (Espace 2)
- **Assaut** — Electron + React, Windows PC mallette (Espace 3)
- **Débriefing** — React Native, Android smartphone (Game Master)
- **Server NUC** — Node.js + WebSocket + SQLite, Intel NUC

## Prerequisites

- Node 24 LTS (project standard, see `docs/architecture.md` § Decision log)
- pnpm 10+ (auto-managed via `packageManager` in root `package.json` + corepack)
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

- [`docs/CONTRIBUTING.md`](./docs/CONTRIBUTING.md) — project conventions, build commands, immutable rules
- [`docs/architecture.md`](./docs/architecture.md) — technical decisions
- [`docs/m1-plan.md`](./docs/m1-plan.md) — active milestone plan
- [`docs/glossary.md`](./docs/glossary.md) — vocabulary
- [`docs/conventions/`](./docs/conventions/) — per-app engineering conventions
- [`CHANGELOG.md`](./CHANGELOG.md) — release notes per version
- [`SECURITY.md`](./SECURITY.md) — vulnerability disclosure policy
- [`LICENSE`](./LICENSE) — proprietary, all rights reserved
- [`docs/m1-handoff-validation.pdf`](./docs/m1-handoff-validation.pdf) — handoff document signed at the M1 visio
- [`docs/m1-validation-guide.pdf`](./docs/m1-validation-guide.pdf) — printable client-side validation guide (Nathanaël + IT team)

## Pour Nathanaël & son équipe IT

Tout ce qu'il faut pour valider M1 sur votre matériel, en 3 liens :

1. **Télécharger les binaires** — la release [`v0.1.0`](https://github.com/gs-imak/code-rouge/releases/tag/v0.1.0) contient les 3 fichiers prêts à installer :
   - `code-rouge-attaque-de-bots-v0.1.0.apk` → tablette Android 10"
   - `code-rouge-debriefing-v0.1.0.apk` → smartphone Game Master
   - `code-rouge-assaut-v0.1.0-Setup.exe` → PC Windows mallette
2. **Suivre le guide d'installation et de validation** — [`docs/m1-validation-guide.pdf`](./docs/m1-validation-guide.pdf), 6 pages, imprimable, avec checklist à 8 cases.
3. **Lancer l'auto-test sur le NUC** une fois installé : `bash tools/scripts/validate-m1.sh` → verdict vert/rouge sur 8 contrôles automatisés.

**Si une case manque ou si l'auto-test passe au rouge** : ouvrir une issue sur [GitHub](https://github.com/gs-imak/code-rouge/issues) en attachant le rapport (`/tmp/m1-validation-*.txt`), ou contacter Georges directement.

## Status

**M1 — Socle technique** : validé en visio le **7 mai 2026**. Release [`v0.1.0`](https://github.com/gs-imak/code-rouge/releases/tag/v0.1.0) publiée.
M2 démarrera dès la livraison des maquettes Laura et de la première salve de contenus côté client.
