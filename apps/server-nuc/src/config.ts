// Runtime config from env vars. Read once at boot — fail fast if invalid.
// Keep this dependency-free so it can be imported anywhere without a cycle.

export interface ServerConfig {
  readonly host: string
  readonly port: number
  readonly databasePath: string
  readonly logLevel: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace'
  readonly nodeEnv: 'development' | 'production' | 'test'
}

const VALID_LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'] as const

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const nodeEnv = (env.NODE_ENV ?? 'development') as ServerConfig['nodeEnv']

  // 127.0.0.1 in dev so the server isn't reachable beyond the dev machine.
  // In production on the NUC, HOST must be set to the LAN interface IP — never 0.0.0.0.
  // See .claude/rules/server-nuc.md and docs/architecture.md § 6.
  const host = env.HOST ?? '127.0.0.1'

  const portStr = env.PORT ?? '8080'
  const port = Number.parseInt(portStr, 10)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT: ${portStr}`)
  }

  const databasePath = env.DATABASE_PATH ?? 'data/coderouge.sqlite'

  const rawLogLevel = env.LOG_LEVEL ?? (nodeEnv === 'production' ? 'info' : 'debug')
  if (!VALID_LOG_LEVELS.includes(rawLogLevel as (typeof VALID_LOG_LEVELS)[number])) {
    throw new Error(`Invalid LOG_LEVEL: ${rawLogLevel}`)
  }
  const logLevel = rawLogLevel as ServerConfig['logLevel']

  return { host, port, databasePath, logLevel, nodeEnv }
}
