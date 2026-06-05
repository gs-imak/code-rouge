import { createServer, type Server as HttpServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import express, { type Express, type Request, type Response } from 'express'
import { WebSocketServer, WebSocket, type RawData } from 'ws'
import type { Logger } from 'pino'
import {
  parseAppToServerMessage,
  MessageParseError,
  type AppToServerMessage,
  type ServerToAppMessage,
  type RestoreMessage,
  type WelcomeMessage,
  type AccessResultMessage,
  type McodeMessage,
  type TeamsResultMessage,
  type LogResultMessage,
} from '@code-rouge/shared-types'
import { loadConfig, type ServerConfig } from './config.js'
import { createLogger } from './logger.js'
import { openDb, type DbHandle } from './db.js'
import { newResetCode, newSessionId } from './session.js'

interface BootedServer {
  readonly http: HttpServer
  readonly app: Express
  readonly wss: WebSocketServer
  readonly db: DbHandle
  readonly logger: Logger
  readonly config: ServerConfig
  readonly sessionId: string
}

// Largest legitimate WS frame: a log push with 1000 events × ~200 B each plus
// envelope. 512 KB is comfortable margin without enabling 100 MB DoS frames.
const WS_MAX_PAYLOAD_BYTES = 512 * 1024

// A legit app emits ≤ 1 state update / second + occasional log batches.
// 100 frames / second per connection leaves multiple orders of magnitude of
// burst headroom while killing tight-loop floods from a venue Wi-Fi attacker.
const WS_RATE_LIMIT_PER_SEC = 100

export interface CreateAppDeps {
  readonly logger: Logger
  readonly startedAt: number
  readonly sessionId: string
  readonly resetCode: string
  readonly db: DbHandle
  /**
   * Lazy accessor for currently-connected WS clients. Lazy because
   * `createApp` runs before the WebSocketServer is attached to the
   * HTTP server — the closure-captured `wss.clients` would be the
   * pre-attach (empty) Set otherwise.
   */
  readonly getConnectedClients: () => Iterable<{ readonly app?: string }>
}

export function createApp(deps: CreateAppDeps): Express {
  const { logger, startedAt, sessionId, resetCode, db, getConnectedClients } = deps
  const app = express()

  app.disable('x-powered-by')
  app.use(express.json({ limit: '64kb' }))

  app.get('/health', (_req: Request, res: Response) => {
    // Cheap — apps poll this every 5s. db.ping() uses a hoisted prepared
    // statement; the catch swallows transient db errors so the route still
    // returns 200 with `db: 'error'` (apps treat that as a soft signal).
    let dbOk = false
    try {
      db.ping()
      dbOk = true
    } catch {
      dbOk = false
    }
    res.status(200).json({
      status: 'ok',
      uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
      pid: process.pid,
      sessionId,
      db: dbOk ? 'ok' : 'error',
    })
  })

  app.get('/diag', (_req: Request, res: Response) => {
    // Diagnostic snapshot — surfaced by the GM-facing Débriefing app's
    // operator screen and (in chantier 06+) by an Assaut admin overlay.
    // Wifi quality is hardware-dependent (`iw dev wlan0 link` on the NUC)
    // and lands when the install-nuc.sh script can publish that telemetry
    // alongside the systemd unit. For now we report what's strictly
    // observable from inside the Node process.
    const perApp: Record<string, number> = {}
    let total = 0
    for (const client of getConnectedClients()) {
      total += 1
      const a = client.app
      if (typeof a === 'string') {
        perApp[a] = (perApp[a] ?? 0) + 1
      }
    }
    res.status(200).json({
      sessionId,
      uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
      connectedClients: { total, perApp },
      // Schema version so consumers can branch on it as we add fields.
      schemaVersion: 1,
    })
  })

  // Per-IP brute-force lockout for /admin/reset. Constant-time compare
  // alone doesn't prevent code-space exhaustion (~9e5 codes at 1k req/s
  // = ~15 min on a 6-digit alphanumeric). A 5-attempt-per-60-second
  // ceiling kills any practical spray attack while leaving the GM's
  // typo-then-retry workflow unaffected.
  const RESET_MAX_ATTEMPTS = 5
  const RESET_LOCKOUT_MS = 60_000
  const resetAttempts = new Map<string, { count: number; lockedUntil: number }>()

  // Sweep expired lockouts so an IP that triggered the cap and never
  // came back doesn't pin its entry forever. Mirrors the connectionWindow
  // sweep below for structural consistency. .unref() so the timer
  // doesn't keep the event loop alive past process shutdown.
  setInterval(() => {
    const now = Date.now()
    for (const [ip, entry] of resetAttempts) {
      if (entry.lockedUntil > 0 && now >= entry.lockedUntil) {
        resetAttempts.delete(ip)
      }
    }
  }, RESET_LOCKOUT_MS).unref()

  app.post('/admin/reset', (req: Request, res: Response) => {
    // Per-session reset code (architecture.md §3). Must NEVER be a static
    // password — the GM reads the code off the Débriefing app at game
    // start and types it here to wipe state between sessions.
    //
    // Use req.socket.remoteAddress directly (not req.ip) so the lockout
    // key is independent of Express's `trust proxy` setting. The NUC is
    // LAN-only with no reverse proxy today, but if someone later sets
    // `app.set('trust proxy', 1)` for ops logging through a gateway,
    // req.ip would silently start trusting X-Forwarded-For and the
    // lockout would become spoofable via a header.
    const remote = req.socket.remoteAddress ?? 'unknown'
    const now = Date.now()

    // Lockout check up front so timing of the lockout response doesn't
    // depend on the body parse path.
    const entry = resetAttempts.get(remote)
    if (entry !== undefined && now < entry.lockedUntil) {
      logger.warn({ remote, lockedUntilMs: entry.lockedUntil - now }, '/admin/reset: locked out')
      res.status(429).json({ error: 'too many attempts' })
      return
    }

    // The body is express.json-parsed up to 64 KB; we only inspect a single
    // string field. Any other shape → 400 (don't even hint at validity).
    const body = req.body as unknown
    const submitted =
      typeof body === 'object' && body !== null && 'code' in body && typeof body.code === 'string'
        ? body.code
        : null
    if (submitted === null) {
      res.status(400).json({ error: 'invalid body — expected { code: string }' })
      return
    }

    // Constant-time comparison so a tight retry loop can't probe the code
    // length-by-length via response timing. Both inputs are ASCII session
    // codes (architecture allocates them, never user-input — but defence
    // in depth costs nothing here).
    if (!constantTimeEquals(submitted, resetCode)) {
      const next = (entry?.count ?? 0) + 1
      const lockedUntil = next >= RESET_MAX_ATTEMPTS ? now + RESET_LOCKOUT_MS : 0
      resetAttempts.set(remote, { count: next, lockedUntil })
      logger.warn(
        { remote, attempts: next, locked: lockedUntil > 0 },
        '/admin/reset: bad code',
      )
      res.status(401).json({ error: 'unauthorized' })
      return
    }

    // Successful auth clears the per-IP attempt counter so a GM who
    // mistyped twice then got it right doesn't carry residual state.
    resetAttempts.delete(remote)

    const result = db.resetSession(sessionId)
    logger.info(
      { sessionId, ...result, remote },
      '/admin/reset: session wiped',
    )
    res.status(200).json({
      ok: true,
      sessionId,
      ...result,
    })
  })

  app.use((req: Request, res: Response) => {
    logger.warn({ method: req.method, url: req.url }, 'unknown route')
    res.status(404).json({ error: 'not found' })
  })

  return app
}

// Constant-time string comparison. Both values are short (~12 chars) so
// the cost is negligible even in the bad-code path.
//
// Importantly: do NOT early-return on length mismatch. An attacker
// submitting codes of varying length would otherwise observe a faster
// "wrong length" response than a "wrong contents" response, narrowing
// the search from `2^n × possible-codes` to `possible-codes` once the
// length lands. Instead, fold the length difference into the diff
// accumulator and run the loop over Math.max(a.length, b.length).
function constantTimeEquals(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length)
  // Seed `diff` with any length mismatch so it cannot zero out even if
  // every overlapping character matches (e.g. submitted "abc" vs "abcd").
  let diff = a.length ^ b.length
  for (let i = 0; i < len; i += 1) {
    // charCodeAt returns NaN for out-of-range indices; (NaN ^ x) is 0
    // in JS, which would weaken the guard. Coalesce to 0 explicitly.
    const ca = i < a.length ? a.charCodeAt(i) : 0
    const cb = i < b.length ? b.charCodeAt(i) : 0
    diff |= ca ^ cb
  }
  return diff === 0
}

// Normalises every WS data variant (Buffer | ArrayBuffer | Buffer[]) into a
// single UTF-8 string before JSON.parse. Without this, a fragmented frame
// arrives as Buffer[]; calling `.toString()` on it produces comma-separated
// decimal bytes, which can either fail JSON.parse OR — worse — silently
// produce a plausible-looking but truncated value.
function rawToString(raw: RawData): string {
  if (Array.isArray(raw)) return Buffer.concat(raw).toString('utf-8')
  if (Buffer.isBuffer(raw)) return raw.toString('utf-8')
  return Buffer.from(raw).toString('utf-8')
}

interface WsContext {
  readonly sessionId: string
  readonly db: DbHandle
  readonly logger: Logger
  readonly isShuttingDown: () => boolean
}

// Per-connection metadata captured after Hello so /diag can report
// connections grouped by app, and so GM↔team relays can route by teamId.
// Stored on the ws instance via a WeakMap rather than monkey-patching the
// WebSocket — keeps the third-party type intact and lets GC collect metadata
// when the socket dies.
export const wsMeta = new WeakMap<
  WebSocket,
  { app: string; deviceId: string; teamId: number | null }
>()

// Relay a Server → App payload to every OPEN connection of `targetApp` belonging
// to `targetTeamId`. Used for the GM-mediated access-point / MG-code exchanges:
// the GM (Débriefing) rules on a team, the server forwards the verdict to that
// team's Assaut app. Returns the number of recipients (0 = team not connected).
function relayToTeam(
  peers: Iterable<WebSocket>,
  targetApp: string,
  targetTeamId: number,
  payload: ServerToAppMessage,
): number {
  const data = JSON.stringify(payload)
  let sent = 0
  for (const peer of peers) {
    const meta = wsMeta.get(peer)
    if (
      meta?.app === targetApp &&
      meta.teamId === targetTeamId &&
      peer.readyState === WebSocket.OPEN
    ) {
      peer.send(data)
      sent += 1
    }
  }
  return sent
}

function handleAppMessage(
  msg: AppToServerMessage,
  ws: WebSocket,
  ctx: WsContext,
  peers: () => Iterable<WebSocket>,
): void {
  switch (msg.type) {
    case 'hello': {
      wsMeta.set(ws, { app: msg.app, deviceId: msg.deviceId, teamId: msg.teamId })
      ctx.logger.info(
        {
          app: msg.app,
          deviceId: msg.deviceId,
          teamId: msg.teamId,
          lastKnownStep: msg.lastKnownStep,
        },
        'WS hello',
      )

      // Look up prior state for this device WITHIN THIS SESSION.
      // Cross-session lookups were rejected in security review (deviceId
      // is sniffable off the LAN; allowing cross-session would let any
      // player read another team's prior-day progress).
      const prior = ctx.db.getTeamStateByDevice(ctx.sessionId, msg.deviceId, msg.app)

      const welcomeTeamId = msg.teamId ?? prior?.team_id ?? 0
      const welcome: WelcomeMessage = {
        type: 'welcome',
        teamId: welcomeTeamId,
        sessionId: ctx.sessionId,
        serverTime: Date.now(),
      }
      ws.send(JSON.stringify(welcome))

      if (prior !== undefined) {
        const restore: RestoreMessage = {
          type: 'restore',
          teamId: prior.team_id,
          app: msg.app,
          step: prior.step,
          score: prior.score,
          timestamp: prior.timestamp,
        }
        ws.send(JSON.stringify(restore))
        ctx.logger.info(
          { deviceId: msg.deviceId, teamId: prior.team_id, step: prior.step },
          'WS restore emitted',
        )
      }
      return
    }
    case 'state': {
      // Keep the connection's teamId fresh so GM relays route correctly even if
      // the team was assigned after Hello.
      const meta = wsMeta.get(ws)
      if (meta !== undefined && msg.teamId !== null) {
        wsMeta.set(ws, { ...meta, teamId: msg.teamId })
      }
      const persisted = ctx.db.upsertTeamState(ctx.sessionId, msg)
      ctx.logger.debug(
        { app: msg.app, teamId: msg.teamId, step: msg.step, score: msg.score, persisted },
        'WS state',
      )
      return
    }
    case 'log': {
      const inserted = ctx.db.appendLogEvents(ctx.sessionId, msg)
      ctx.logger.debug({ app: msg.app, teamId: msg.teamId, inserted }, 'WS log')
      return
    }
    case 'pong': {
      ctx.logger.trace({ app: msg.app, deviceId: msg.deviceId }, 'WS pong')
      return
    }
    case 'access-submit': {
      // A team submits an entry point for GM approval. Recorded here; the GM
      // (Débriefing) app surfaces pending submissions + rules on them. The
      // verdict comes back as an 'access-decision' (below).
      ctx.logger.info(
        { app: msg.app, teamId: msg.teamId, point: msg.point },
        'WS access-submit',
      )
      return
    }
    case 'access-decision': {
      // GM verdict → relay to the target team's Assaut app, which shows the
      // Validation (« Félicitations ») or Refus (« Échec ») screen.
      const result: AccessResultMessage = { type: 'access-result', decision: msg.decision }
      if (msg.label !== undefined) result.label = msg.label
      const sent = relayToTeam(peers(), 'assaut', msg.targetTeamId, result)
      ctx.logger.info(
        { targetTeamId: msg.targetTeamId, decision: msg.decision, recipients: sent },
        'WS access-decision relayed',
      )
      return
    }
    case 'mg-code-set': {
      // GM sets the authorisation code → relay to the waiting team's Assaut app.
      const code: McodeMessage = { type: 'mg-code', code: msg.code }
      const sent = relayToTeam(peers(), 'assaut', msg.targetTeamId, code)
      ctx.logger.info(
        { targetTeamId: msg.targetTeamId, recipients: sent },
        'WS mg-code-set relayed',
      )
      return
    }
    case 'teams-request': {
      // GM-only: a player app must not enumerate teams (immutable rule — log data
      // is GM-scoped). Reject anything that isn't the Débriefing app.
      if (msg.app !== 'debriefing') {
        ctx.logger.warn({ app: msg.app }, 'WS teams-request denied (non-débriefing)')
        return
      }
      const teams = ctx.db.getTeamSummaries(ctx.sessionId)
      const result: TeamsResultMessage = {
        type: 'teams',
        teams: teams.map((t) => ({ teamId: t.teamId, apps: [...t.apps] })),
      }
      ws.send(JSON.stringify(result))
      ctx.logger.info({ teamCount: teams.length }, 'WS teams-request served')
      return
    }
    case 'log-request': {
      // GM-only: a player app must not read another team's event log.
      if (msg.app !== 'debriefing') {
        ctx.logger.warn(
          { app: msg.app, targetTeamId: msg.targetTeamId },
          'WS log-request denied (non-débriefing)',
        )
        return
      }
      const events = ctx.db.getEventLog(ctx.sessionId, msg.targetTeamId)
      const result: LogResultMessage = { type: 'log-result', teamId: msg.targetTeamId, events }
      ws.send(JSON.stringify(result))
      ctx.logger.info(
        { targetTeamId: msg.targetTeamId, eventCount: events.length },
        'WS log-request served',
      )
      return
    }
  }
}

// Per-IP connection rate limit. Twelve tablets reconnecting at once
// after a brief NUC restart hits each ~3 attempts in 10 s; a single
// misbehaving laptop can trivially exceed any reasonable threshold.
// 10 attempts / 10 s allows a healthy reconnect storm and rejects
// abuse. Rejected attempts return 429 before `handleUpgrade` runs, so
// nothing is allocated past the TCP socket.
const CONNECTION_RATE_LIMIT = 10
const CONNECTION_RATE_WINDOW_MS = 10_000

function attachWebSocket(http: HttpServer, ctx: WsContext): WebSocketServer {
  // noServer mode so we control the upgrade path explicitly (route-scoped
  // to /ws). maxPayload kicks in at the protocol layer before any JS
  // touches frame contents — DoS guard against multi-megabyte frames.
  const wss = new WebSocketServer({ noServer: true, maxPayload: WS_MAX_PAYLOAD_BYTES })

  // Rolling window of connection attempts per remote IP. Pruned on every
  // upgrade (cheap) and via a periodic sweep (bounded growth between
  // upgrades). Map size bounded by simultaneous remote IPs ≤ 12 + a
  // handful of GM/operator devices; no memory concern.
  const connectionWindow = new Map<string, { count: number; resetAt: number }>()
  const sweepInterval = setInterval(() => {
    const now = Date.now()
    for (const [ip, entry] of connectionWindow) {
      if (now >= entry.resetAt) connectionWindow.delete(ip)
    }
  }, CONNECTION_RATE_WINDOW_MS).unref()

  http.on('upgrade', (req, socket, head) => {
    if (req.url !== '/ws') {
      ctx.logger.warn({ url: req.url }, 'WS upgrade rejected: unknown path')
      // Clean HTTP response before destroy so the client sees 404, not a
      // bare connection reset — easier to debug a misconfigured app.
      socket.write('HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n')
      socket.destroy()
      return
    }

    const remote = req.socket.remoteAddress ?? 'unknown'
    const now = Date.now()
    const entry = connectionWindow.get(remote)
    if (entry === undefined || now >= entry.resetAt) {
      connectionWindow.set(remote, { count: 1, resetAt: now + CONNECTION_RATE_WINDOW_MS })
    } else {
      entry.count += 1
      if (entry.count > CONNECTION_RATE_LIMIT) {
        ctx.logger.warn(
          { remote, count: entry.count, windowMs: CONNECTION_RATE_WINDOW_MS },
          'WS upgrade rejected: per-IP connection rate limit',
        )
        socket.write('HTTP/1.1 429 Too Many Requests\r\nConnection: close\r\n\r\n')
        socket.destroy()
        return
      }
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req)
    })
  })

  // Pass sweepInterval cleanup to the close path.
  wss.on('close', () => clearInterval(sweepInterval))

  wss.on('connection', (ws: WebSocket, req) => {
    const remote = req.socket.remoteAddress ?? 'unknown'
    ctx.logger.info({ remote }, 'WS connection opened')

    // Per-connection token bucket. Resets once a second.
    let messageCount = 0
    const rateLimitInterval = setInterval(() => {
      messageCount = 0
    }, 1000)

    ws.on('message', (raw, isBinary) => {
      if (ctx.isShuttingDown()) {
        // Don't mutate state during shutdown. The close frame is queued from
        // the shutdown path; the client will see it shortly.
        return
      }
      if (isBinary) {
        ctx.logger.warn({ remote }, 'WS binary frame rejected')
        return
      }
      messageCount += 1
      if (messageCount > WS_RATE_LIMIT_PER_SEC) {
        ctx.logger.warn({ remote, messageCount }, 'WS rate limit exceeded — dropping frame')
        return
      }
      let msg: AppToServerMessage
      try {
        msg = parseAppToServerMessage(rawToString(raw))
      } catch (err) {
        if (err instanceof MessageParseError) {
          ctx.logger.warn({ remote, err: err.message }, 'WS message rejected')
        } else {
          ctx.logger.error({ remote, err }, 'WS unexpected parse error')
        }
        return
      }
      try {
        handleAppMessage(msg, ws, ctx, () => wss.clients)
      } catch (err) {
        ctx.logger.error({ remote, type: msg.type, err }, 'WS handler error')
      }
    })

    ws.on('close', (code, reason) => {
      clearInterval(rateLimitInterval)
      // WeakMap deletion isn't strictly required (GC handles it once the
      // ws is unreachable), but explicit clearing keeps /diag readings
      // honest in the brief window where the close event has fired but
      // the wss.clients Set hasn't yet evicted the entry.
      wsMeta.delete(ws)
      ctx.logger.info({ remote, code, reason: reason.toString() }, 'WS connection closed')
    })

    ws.on('error', (err) => {
      ctx.logger.error({ remote, err }, 'WS error')
    })
  })

  return wss
}

export function startServer(config: ServerConfig = loadConfig()): BootedServer {
  const startedAt = Date.now()
  const logger = createLogger(config)

  const db = openDb(config, logger)
  const sessionId = newSessionId()
  const resetCode = newResetCode()
  db.ensureSession(sessionId, resetCode)
  // resetCode is admin-grade (gates POST /admin/reset in chantier 04+).
  // Don't write it to the journal in cleartext — the GM reads it off the
  // Débriefing app at game start instead. We log a redacted hint only so an
  // operator can correlate logs to a session without leaking the secret.
  logger.info(
    { sessionId, resetCodeHint: `${resetCode.slice(0, 2)}****` },
    'session ready',
  )

  let shuttingDown = false
  const ctx: WsContext = {
    sessionId,
    db,
    logger,
    isShuttingDown: () => shuttingDown,
  }

  // Lazy reference into wss.clients — wss is constructed below, but the
  // /diag handler closure captures this ref and reads `current` at
  // request time, by which point wss is fully attached.
  const wssRef: { current: WebSocketServer | null } = { current: null }
  const app = createApp({
    logger,
    startedAt,
    sessionId,
    resetCode,
    db,
    getConnectedClients: function* () {
      const wss = wssRef.current
      if (wss === null) return
      for (const ws of wss.clients) {
        const meta = wsMeta.get(ws)
        yield meta === undefined ? {} : { app: meta.app }
      }
    },
  })
  const http = createServer(app)
  const wss = attachWebSocket(http, ctx)
  wssRef.current = wss

  http.listen(config.port, config.host, () => {
    logger.info(
      { host: config.host, port: config.port, nodeEnv: config.nodeEnv },
      'server listening',
    )
  })

  // Graceful shutdown — set flag (gates incoming WS messages), drain WS
  // clients, close HTTP, close db (with WAL checkpoint), exit.
  const shutdown = (signal: NodeJS.Signals) => {
    if (shuttingDown) return
    shuttingDown = true
    logger.info({ signal }, 'shutdown initiated')
    wss.clients.forEach((ws) => ws.close(1001, 'server shutting down'))
    http.close((err) => {
      if (err) {
        logger.error({ err }, 'error during http close')
      }
      db.close()
      logger.info('shutdown complete')
      process.exit(err ? 1 : 0)
    })
    setTimeout(() => {
      logger.warn('forced exit after 5s')
      try {
        db.close()
      } catch {
        // already closed
      }
      process.exit(1)
    }, 5000).unref()
  }
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))

  return { http, app, wss, db, logger, config, sessionId }
}

// Boot when invoked directly (tsx watch / node dist/index.js).
// Skipped in tests where the file is imported, not executed.
// fileURLToPath normalises Windows file:// URLs (file:///C:/... → C:\...).
const invokedPath = process.argv[1]
if (invokedPath !== undefined && fileURLToPath(import.meta.url) === invokedPath) {
  startServer()
}
