import { createServer, type Server as HttpServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import express, { type Express, type Request, type Response } from 'express'
import { WebSocketServer, type WebSocket } from 'ws'
import type { Logger } from 'pino'
import { loadConfig, type ServerConfig } from './config.js'
import { createLogger } from './logger.js'

interface BootedServer {
  readonly http: HttpServer
  readonly app: Express
  readonly wss: WebSocketServer
  readonly logger: Logger
  readonly config: ServerConfig
}

export function createApp(logger: Logger, startedAt: number): Express {
  const app = express()

  app.disable('x-powered-by')
  app.use(express.json({ limit: '64kb' }))

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
      pid: process.pid,
    })
  })

  app.use((req: Request, res: Response) => {
    logger.warn({ method: req.method, url: req.url }, 'unknown route')
    res.status(404).json({ error: 'not found' })
  })

  return app
}

function attachWebSocket(http: HttpServer, logger: Logger): WebSocketServer {
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

    ws.on('message', (raw) => {
      // Chantier 03.2 will parse via @code-rouge/shared-types parseMessage; for now log raw.
      logger.debug({ remote, bytes: raw.toString().length }, 'WS message received')
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
  const app = createApp(logger, startedAt)
  const http = createServer(app)
  const wss = attachWebSocket(http, logger)

  http.listen(config.port, config.host, () => {
    logger.info(
      { host: config.host, port: config.port, nodeEnv: config.nodeEnv },
      'server listening',
    )
  })

  // Graceful shutdown — drain WS connections, close HTTP, exit.
  // SIGTERM = systemd stop; SIGINT = Ctrl+C in dev.
  const shutdown = (signal: NodeJS.Signals) => {
    logger.info({ signal }, 'shutdown initiated')
    wss.clients.forEach((ws) => ws.close(1001, 'server shutting down'))
    http.close((err) => {
      if (err) {
        logger.error({ err }, 'error during http close')
        process.exit(1)
      }
      logger.info('shutdown complete')
      process.exit(0)
    })
    // Hard cap so we never hang systemd.
    setTimeout(() => {
      logger.warn('forced exit after 5s')
      process.exit(1)
    }, 5000).unref()
  }
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))

  return { http, app, wss, logger, config }
}

// Boot when invoked directly (tsx watch / node dist/index.js).
// Skipped in tests where the file is imported, not executed.
// fileURLToPath normalises Windows file:// URLs (file:///C:/... → C:\...).
const invokedPath = process.argv[1]
if (invokedPath !== undefined && fileURLToPath(import.meta.url) === invokedPath) {
  startServer()
}
