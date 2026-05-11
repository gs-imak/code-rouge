# Conventions — apps/server-nuc

Engineering conventions for the `apps/server-nuc/` Node.js + WebSocket + SQLite server (runs on Intel NUC).

- **Target host:** Intel NUC, Ubuntu 22.04 LTS or 24.04 LTS, running headless
  (no GUI, no monitor). Resource budget: 8 GB RAM, modest CPU. Don't write
  code that assumes lots of RAM or fast disk.
- **No async footguns:** prefer `better-sqlite3`'s synchronous API over
  any async ORM. We're a single-writer DB on a small device — sync is
  simpler and faster for our access patterns.
- **All inbound payloads validated by Zod** before touching state.
  No exceptions. If the schema doesn't exist yet, write it before the handler.
- **Schemas of record:** `packages/shared-types/src/messages.ts`. Never
  define message shapes here in the server package. Import them.
- **Logging:** `pino` everywhere. Use structured logs (`logger.info({ teamId, app }, 'state update')`),
  never string interpolation in the message. Prod logs go to
  `/var/log/code-rouge/server.log` via systemd journal.
- **Health & diagnostics:** `GET /health` must respond in < 50ms even
  under load — it's polled by the apps every 5s. Keep it cheap.
- **Migrations:** SQL files in `apps/server-nuc/migrations/`, numbered
  `NNN_description.sql`. Applied once in order on startup. Never edit a
  migration that's been deployed — write a new one.
- **Don't expose anything beyond the LAN.** Bind to the LAN interface only,
  never `0.0.0.0` in production. The NUC is on a private network behind
  the venue's mesh router; assume nothing about external reachability.
- **Reset endpoint** (`POST /admin/reset`) requires a per-session code
  generated at game start, not a static password. Code is shown to the GM
  on the Débriefing app.
- **Deploy script:** `tools/scripts/install-nuc.sh`. Idempotent — running
  it twice on the same NUC must not break anything. Test with `shellcheck`.
