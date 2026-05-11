# `@code-rouge/server-nuc`

Local server that runs on the Intel NUC during a Code Rouge session. WebSocket
hub for the three player apps (`attaque-de-bots`, `assaut`, `debriefing`),
SQLite persistence, HTTP health / diagnostic endpoints. **LAN-only** — never
expose beyond the venue router.

## Endpoints

| Method | Path        | Purpose                                                       |
| ------ | ----------- | ------------------------------------------------------------- |
| GET    | `/health`   | 200 OK, `{ status, uptimeSeconds, pid, sessionId, db }`. < 50 ms — apps poll every 5 s. |
| WS     | `/ws`       | Primary channel: `hello → welcome ⇄ state / log / pong / cmd`. |

`POST /admin/reset` and `GET /diag` arrive in chantier 04+.

## WebSocket protocol

Schemas of record live in [`packages/shared-types/src/messages.ts`](../../packages/shared-types/src/messages.ts).
Every inbound frame is parsed by `parseAppToServerMessage` before the server
mutates any state — payloads that fail Zod validation are dropped and logged
(`WS message rejected`). Outbound frames go through `JSON.stringify` of typed
union members.

## Configuration

All knobs are env vars, read once at boot. Failure to validate aborts startup.

| Var             | Default                     | Notes                                                     |
| --------------- | --------------------------- | --------------------------------------------------------- |
| `HOST`          | `127.0.0.1`                 | **Must** be the LAN interface IP in production. Never `0.0.0.0`. |
| `PORT`          | `8080`                      |                                                           |
| `DATABASE_PATH` | `data/coderouge.sqlite`     | Parent dir is auto-created.                               |
| `LOG_LEVEL`     | `debug` (dev) / `info` (prod) | One of `fatal\|error\|warn\|info\|debug\|trace`. |
| `NODE_ENV`      | `development`               | `production` switches off pino-pretty and tightens logging. |

## Local development

```bash
pnpm install
pnpm dev --filter @code-rouge/server-nuc
# In a second terminal:
curl http://127.0.0.1:8080/health
```

WebSocket smoke test (uses `ws` from devDependencies):

```bash
node -e "const ws=new (require('ws'))('ws://127.0.0.1:8080/ws');ws.on('open',()=>{ws.send(JSON.stringify({type:'hello',app:'attaque-de-bots',deviceId:'dev-1',teamId:7}));});ws.on('message',m=>console.log(m.toString()));"
```

Database query while the server is running (server uses WAL — readers don't block):

```bash
node -e "const D=require('better-sqlite3');const db=new D('apps/server-nuc/data/coderouge.sqlite',{readonly:true});console.log(db.prepare('SELECT * FROM team_state').all());"
```

## Production deploy (Intel NUC, Ubuntu 22.04 / 24.04 LTS)

The deploy script provisions everything end-to-end:

```bash
sudo ./tools/scripts/install-nuc.sh
```

What it does (idempotent — safe to re-run):

1. Installs **Node.js 24 LTS** via NodeSource (`setup_24.x`).
2. Enables `corepack` + activates pnpm to match `packageManager` in root `package.json`.
3. Creates a `code-rouge` system user (no shell, no home).
4. Clones `gs-imak/code-rouge#main` into `/opt/code-rouge`.
5. Runs `pnpm install --frozen-lockfile`.
6. Writes `/etc/systemd/system/code-rouge-server.service` with hardening
   (`NoNewPrivileges`, `ProtectSystem=strict`, `RestrictAddressFamilies`, …).
7. Writes `/etc/logrotate.d/code-rouge-server` (weekly, 8 rotations).
8. `systemctl enable --now code-rouge-server`.

Override defaults via env:

```bash
sudo NODE_MAJOR=24 LISTEN_HOST=192.168.42.10 LISTEN_PORT=8080 \
  ./tools/scripts/install-nuc.sh
```

### Filesystem layout (production)

| Path                                          | Owner        | Contents                                  |
| --------------------------------------------- | ------------ | ----------------------------------------- |
| `/opt/code-rouge`                             | `code-rouge` | Repo checkout                             |
| `/var/lib/code-rouge/coderouge.sqlite`        | `code-rouge` | SQLite DB (WAL + shm files alongside)     |
| `/var/log/code-rouge/server.log`              | `code-rouge` | Pino JSON, rotated weekly                 |
| `/etc/systemd/system/code-rouge-server.service` | root       | Service unit                              |

### Operator commands

```bash
systemctl status code-rouge-server
journalctl -u code-rouge-server --since '1h ago'
tail -f /var/log/code-rouge/server.log
curl http://${LISTEN_HOST}:${LISTEN_PORT}/health
```

## Network policy (immutable rule)

The NUC sits on a private LAN behind the venue mesh router. The server **must
not** be reachable from the public internet. `HOST` is bound to the LAN
interface explicitly; no firewall rule should ever forward port 8080 from
WAN. There are no outbound HTTP calls at runtime — no telemetry, no analytics,
no media pulls — per [`docs/CONTRIBUTING.md`](../../docs/CONTRIBUTING.md) immutable rule 6 and architecture decision
log.

## Migrations

SQL files in [`migrations/`](./migrations/), numbered `NNN_description.sql`.
Applied once in order on startup, gated by the `_migrations` audit table.
**Never edit a deployed migration.** Add a new numbered file instead.

## Logging

`pino` with `pino-pretty` only in dev. Production emits raw JSON straight to
the systemd journal **and** to `/var/log/code-rouge/server.log`. Use
structured fields (`logger.info({ teamId, app }, 'state update')`); never
string-interpolate variables into the message — it breaks downstream
filtering by the GM's debrief tooling later in M1.
