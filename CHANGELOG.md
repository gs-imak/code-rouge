# Changelog

All notable changes to Code Rouge are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Planned for M2:

- Design tokens + maquettes integration (pending Laura's deliverables).
- Énigme content drop (pending content from The Game).
- Debrief aggregation flow (slide generation, log collection, stats engine).
- Sign-in with the Game Master unlock code for the Débriefing app.

## [0.1.0] — 2026-05-07

First milestone of the project ("M1 — Socle technique"). Validated in visio
with the client on 7 May 2026.

### Added

- pnpm + Turborepo monorepo with four runtime applications: `attaque-de-bots`
  (Android tablet, React Native), `assaut` (Windows PC, Electron + React),
  `debriefing` (Android smartphone, React Native), and `server-nuc` (Node.js
  + WebSocket + SQLite, runs on an Intel NUC).
- Three shared packages: `design-system` (tokens, themed components),
  `shared-types` (Zod schemas + JSON config types), `shared-utils`
  (persistence helpers, retry, network probes).
- GitHub Actions CI pipeline with five jobs — lint, typecheck, tests
  (106 passing), build-android (.apk artifact), build-windows (.exe artifact).
  Artifacts attached to every push on `main` (14-day retention).
- Server endpoints: `GET /health` (<50ms, polled every 5s by the apps),
  `GET /diag` (in-app connectivity dot), `POST /admin/reset` (per-session
  6-digit code, constant-time compare, 5-attempts-per-60s lockout),
  `WS /ws` (primary channel: `hello → welcome ⇄ state / log / pong / cmd`).
- Mode kiosque: Screen Pinning native module on Android (both apps),
  Electron `kiosk:true` + `globalShortcut.register` (Alt+Tab, Alt+F4,
  Ctrl+Esc, Win+L, Win+D, Ctrl+Shift+Esc) on Windows. Both gated on
  `app.isPackaged` so dev runs windowed; packaged builds keep the full
  triple verrou.
- State persistence on every meaningful transition; automatic resume on
  reboot. Tested via integration tests + manual force-stop scenario.
- Diagnostic dot on the three apps (green/red within 2s of NUC reachability
  change).
- Setup admin skeleton on the Débriefing app for the GM to configure the
  NUC IP at venue setup.
- Documentation: project README, per-app READMEs, architecture decision log,
  glossary, M1 plan, per-app engineering conventions under `docs/conventions/`,
  contributor guide at `docs/CONTRIBUTING.md`.
- Client kit (post-validation): printable validation guide PDF
  (`docs/m1-validation-guide.pdf`), automated NUC self-test script
  (`tools/scripts/validate-m1.sh`), Release v0.1.0 with the three binaries
  attached.
- NUC deployment: idempotent installer (`tools/scripts/install-nuc.sh`),
  systemd unit with hardened sandboxing (`MemoryMax=512M`, `CPUQuota=80%`,
  `IPAddressDeny=any` with RFC-1918 allowlist), logrotate config.

### Security

- Defense-in-depth pino log redaction (`draftAuthCode`, `*.draftAuthCode`,
  `body.code`, `*.code`) — game-master reset codes never appear in logs.
- All inbound WebSocket payloads validated by Zod before any state mutation.
- IPC channels (Electron) Zod-validated in both directions; renderer never
  touches `ipcRenderer` directly.
- Server bound to loopback in dev, must be set to a LAN interface IP in
  production (never `0.0.0.0`). Enforced by config validation at boot.
- Admin reset endpoint uses `crypto.randomInt` (bias-free), constant-time
  comparison, and per-IP rate-limit.
- Android debug keystores untracked from the repo (added to `.gitignore`
  pre-launch).
- Workspace-level pnpm overrides for transitively vulnerable dependencies
  (`tar@<7.5.8`, `fast-uri@<3.1.2`).
- `pnpm audit --audit-level=high` enforced as a CI gate.

### Contract delivery (Malt M1)

| Deliverable                                  | Status |
| -------------------------------------------- | ------ |
| Monorepo + design system + commit conventions | ✅      |
| CI pipeline + preview artifacts              | ✅      |
| NUC server (WS / Zod / SQLite / install)     | ✅      |
| Mode kiosque Android (Screen Pinning)        | ✅      |
| Mode kiosque Windows (Electron + désactivation des touches) | ✅ |
| Persistence + reprise auto sur les 3 plateformes | ✅  |
| Squelette Connexion / Setup admin / Diagnostic | ✅    |
| Dépôt GitHub avec accès en lecture           | ✅      |
| Tag de release `v0.1.0`                      | ✅      |
| APK installables                             | ✅      |
| Exécutable Windows .exe                      | ✅      |
| Build serveur NUC packagé + scripts          | ✅      |
| Documentation d'architecture initiale        | ✅      |

[Unreleased]: https://github.com/gs-imak/code-rouge/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/gs-imak/code-rouge/releases/tag/v0.1.0
