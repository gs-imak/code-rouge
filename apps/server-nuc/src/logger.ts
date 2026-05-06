import { pino, type Logger } from 'pino'
import type { ServerConfig } from './config.js'

// Defense-in-depth redact list for fields that should never appear in
// production logs. The server doesn't currently log the full GameState
// (we deliberately project to {teamId, step, score, ...} in handlers),
// but pino's redact config catches the case where:
//
//   1. A future debug log dumps an incoming WS frame verbatim and the
//      renderer mistakenly forwards the full GameState rather than the
//      narrow StateUpdateMessage projection.
//   2. An admin endpoint returns and logs a row from the persistence
//      store that happens to carry draftAuthCode through.
//
// Pino doesn't support deep wildcards (** is not implemented as of
// pino@9). The bare path catches a top-level draftAuthCode; the
// `*.draftAuthCode` wildcard catches any one-level-deep parent key
// (state, payload, body, etc.) without us having to enumerate them.
// Anything deeper than two levels falls through; at that point the
// problem is the log call shape, not the redact list.
// `body.code` and `*.code` cover the /admin/reset request body in case a
// future error handler logs `req.body` verbatim. The reset code is the
// other secret on the wire; redacting it here is cheap defense-in-depth
// for the same reasons as draftAuthCode (no current handler logs it,
// but the cost of preventing a future regression is two list entries).
const REDACT_PATHS = [
  'draftAuthCode',
  '*.draftAuthCode',
  'body.code',
  '*.code',
] as const

export function createLogger(config: ServerConfig): Logger {
  // Pretty printing only in development; production uses raw JSON for systemd journal.
  const transport =
    config.nodeEnv === 'development'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss.l' } }
      : undefined

  return pino({
    level: config.logLevel,
    base: { service: 'code-rouge-server' },
    redact: {
      paths: [...REDACT_PATHS],
      censor: '[REDACTED]',
    },
    ...(transport ? { transport } : {}),
  })
}
