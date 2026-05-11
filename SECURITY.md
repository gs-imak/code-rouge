# Security Policy

## Supported versions

Only the latest tagged release receives security updates.

| Version | Supported |
| ------- | --------- |
| `0.1.x` | ✅ active |
| `< 0.1` | ❌ no     |

## Reporting a vulnerability

Code Rouge handles game-master reset codes, per-session admin secrets,
and runs in kiosk mode on a private LAN. Security issues affect either
the integrity of a live game session or the confidentiality of the
operator's environment.

**Do not open a public GitHub issue for security vulnerabilities.**
Instead:

1. Open a **private security advisory** on the GitHub repository:
   <https://github.com/gs-imak/code-rouge/security/advisories/new>.
2. Include the affected component (`apps/<app>` or `packages/<package>`),
   the platform (Android / Windows / NUC), reproduction steps, and the
   observed impact.
3. If you cannot use GitHub advisories, contact the prestataire through
   the channel agreed in your engagement contract.

You will receive an acknowledgement within 5 working days.

## Threat model

Code Rouge is designed to run **fully offline** on a private Wi-Fi mesh
inside a venue. The following assumptions shape the threat model:

- No public-internet exposure at runtime. The NUC is bound to a LAN
  interface IP; never `0.0.0.0`.
- One Game Master, twelve teams per session, one location. No user
  accounts, no remote access, no multi-tenancy.
- Physical access to the venue is controlled by the operator.

Threats considered:

- Player attempts to exit the kiosk lock from inside an app (mitigated
  by triple verrou — see `docs/conventions/assaut.md` and
  `docs/conventions/attaque-de-bots.md`).
- Malformed payloads on the WebSocket channel (mitigated by Zod
  validation before any state mutation; rejected frames are logged and
  dropped).
- Brute force of the admin reset code (mitigated by constant-time
  compare + per-IP rate limit, 5 attempts per 60 seconds).
- Log redaction of game-master secrets (`pino` redact list).

Threats NOT in scope:

- Remote-network attacks. The product is not internet-facing.
- Sophisticated physical attacks on the mallette PC outside game time.
  The kiosk lock is designed to resist in-game escape attempts, not
  determined offline analysis.

## Disclosure timeline

- T+0: report received.
- T+5 days: acknowledgement.
- T+14 days: initial assessment + severity classification (Critical /
  High / Medium / Low).
- T+30 days (Critical/High) or T+60 days (Medium/Low): patch released
  or mitigation documented. Coordinated disclosure agreed with the
  reporter.

## Security-relevant files

- `apps/server-nuc/src/index.ts` — server entry, WebSocket upgrade,
  HTTP routing, admin reset.
- `apps/server-nuc/src/logger.ts` — redact list.
- `apps/server-nuc/src/config.ts` — host binding validation.
- `apps/assaut/src/main/index.ts` — Electron kiosk lock + IPC handlers.
- `apps/*/android/app/src/main/java/.../KioskModule.kt` — Android Screen
  Pinning bridge.
- `tools/scripts/install-nuc.sh` — systemd hardening (sandboxing,
  IPAddressDeny, MemoryMax, CPUQuota).
- `packages/shared-types/src/messages.ts` — WebSocket payload schemas
  (source of truth).
