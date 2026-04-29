import { createServer, type Server as HttpServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import express, { type Express, type Request, type Response } from 'express'
import { WebSocketServer, type WebSocket } from 'ws'
import type { Logger } from 'pino'
import {
  parseAppToServerMessage,
  MessageParseError,
  type AppToServerMessage,
  type WelcomeMessage,
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

export function createApp(
  logger: Logger,
  startedAt: number,
  sessionId: string,
  db: DbHandle,
): Express {
  const app = express()

  app.disable('x-powered-by')
  app.use(express.json({ limit: '64kb' }))

  app.get('/health', (_req: Request, res: Response) => {
    // Cheap — apps poll this every 5s. Don't add slow checks.
    let dbOk = false
    try {
      db.db.prepare('SELECT 1').get()
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

  app.use((req: Request, res: Response) => {
    logger.warn({ method: req.method, url: req.url }, 'unknown route')
    res.status(404).json({ error: 'not found' })
  })

  return app
}

function handleAppMessage(
  msg: AppToServerMessage,
  ws: WebSocket,
  sessionId: string,
  db: DbHandle,
  logger: Logger,
): void {
  switch (msg.type) {
    case 'hello': {
      logger.info(
        { app: msg.app, deviceId: msg.deviceId, teamId: msg.teamId, lastKnownStep: msg.lastKnownStep },
        'WS hello',
      )
      // Reply with welcome so the app knows which session it's in.
      // teamId on hello may be null; the app will update via state once selected.
      // For chantier 03 we echo back the team if known; assignment policy lives in chantier 04.
      const welcome: WelcomeMessage = {
        type: 'welcome',
        teamId: msg.teamId ?? 0,
        sessionId,
        serverTime: Date.now(),
      }
      ws.send(JSON.stringify(welcome))
      return
    }
    case 'state': {
      const persisted = db.upsertTeamState(sessionId, msg)
      logger.debug(
        { app: msg.app, teamId: msg.teamId, step: msg.step, score: msg.score, persisted },
        'WS state',
      )
      return
    }
    case 'log': {
      const inserted = db.appendLogEvents(sessionId, msg)
      logger.debug({ app: msg.app, teamId: msg.teamId, inserted }, 'WS log')
      return
    }
    case 'pong': {
      logger.trace({ app: msg.app, deviceId: msg.deviceId }, 'WS pong')
      return
    }
  }
}

function attachWebSocket(
  http: HttpServer,
  sessionId: string,
  db: DbHandle,
  logger: Logger,
): WebSocketServer {
  // noServer mode so we control the upgrade path explicitly (route-scoped to /ws).
  const wss = new WebSocketServer({ noServer: true })

  http.on('upgrade', (req, socket, head) => {
    if (req.url !== '/ws') {
      logger.warn({ url: req.url }, 'WS upgrade rejected: unknown path')
      socket.destroy()
      return
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req)
    })
  })

  wss.on('connection', (ws: WebSocket, req) => {
    const remote = req.socket.remoteAddress ?? 'unknown'
    logger.info({ remote }, 'WS connection opened')

    ws.on('message', (raw, isBinary) => {
      if (isBinary) {
        logger.warn({ remote }, 'WS binary frame rejected')
        return
      }
      let msg: AppToServerMessage
      try {
        msg = parseAppToServerMessage(raw.toString('utf-8'))
      } catch (err) {
        if (err instanceof MessageParseError) {
          logger.warn({ remote, err: err.message }, 'WS message rejected')
        } else {
          logger.error({ remote, err }, 'WS unexpected parse error')
        }
        return
      }
      try {
        handleAppMessage(msg, ws, sessionId, db, logger)
      } catch (err) {
        logger.error({ remote, type: msg.type, err }, 'WS handler error')
      }
    })

    ws.on('close', (code, reason) => {
      logger.info({ remote, code, reason: reason.toString() }, 'WS connection closed')
    })

    ws.on('error', (err) => {
      logger.error({ remote, err }, 'WS error')
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
  logger.info({ sessionId, resetCode }, 'session ready')

  const app = createApp(logger, startedAt, sessionId, db)
  const http = createServer(app)
  const wss = attachWebSocket(http, sessionId, db, logger)

  http.listen(config.port, config.host, () => {
    logger.info(
      { host: config.host, port: config.port, nodeEnv: config.nodeEnv },
      'server listening',
    )
  })

  // Graceful shutdown — drain WS connections, close HTTP, close db, exit.
  // SIGTERM = systemd stop; SIGINT = Ctrl+C in dev.
  const shutdown = (signal: NodeJS.Signals) => {
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
const invokedPath = process.argv[1]
if (invokedPath !== undefined && fileURLToPath(import.meta.url) === invokedPath) {
  startServer()
}
