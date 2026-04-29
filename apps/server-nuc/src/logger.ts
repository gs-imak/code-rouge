import { pino, type Logger } from 'pino'
import type { ServerConfig } from './config.js'

export function createLogger(config: ServerConfig): Logger {
  // Pretty printing only in development; production uses raw JSON for systemd journal.
  const transport =
    config.nodeEnv === 'development'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss.l' } }
      : undefined

  return pino({
    level: config.logLevel,
    base: { service: 'code-rouge-server' },
    ...(transport ? { transport } : {}),
  })
}
