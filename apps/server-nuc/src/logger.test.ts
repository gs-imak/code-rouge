import { describe, expect, it } from 'vitest'
import { Writable } from 'node:stream'
import { pino, type Logger } from 'pino'
import { createLogger } from './logger.js'
import type { ServerConfig } from './config.js'

// Capture stream that aggregates pino's serialized JSON output. We bypass
// the public createLogger() for the redaction probes because pino-pretty
// (dev transport) eats the structured fields. Instead we build a logger
// with the same redact options against an in-memory destination, then
// verify the redaction actually fired. The narrow public surface we
// exercise via createLogger() is just shape (level, base bindings).

const baseConfig: ServerConfig = {
  host: '127.0.0.1',
  port: 0,
  databasePath: ':memory:',
  logLevel: 'info',
  nodeEnv: 'production',
}

function captureLogger(): { logger: Logger; lines: () => unknown[] } {
  const captured: string[] = []
  const sink = new Writable({
    write(chunk, _enc, cb) {
      captured.push(chunk.toString())
      cb()
    },
  })
  // Mirror createLogger's production redact config exactly. If the redact
  // surface drifts, this test should drift with it (and we should think
  // about why).
  const logger = pino(
    {
      level: 'info',
      base: { service: 'code-rouge-server' },
      redact: {
        paths: ['draftAuthCode', '*.draftAuthCode'],
        censor: '[REDACTED]',
      },
    },
    sink,
  )
  return {
    logger,
    lines: () =>
      captured
        .flatMap((c) => c.split('\n'))
        .filter((s) => s.length > 0)
        .map((s) => JSON.parse(s) as unknown),
  }
}

describe('createLogger — production shape', () => {
  it('returns a pino logger configured for production (no transport, JSON)', () => {
    const logger = createLogger(baseConfig)
    expect(typeof logger.info).toBe('function')
    expect(logger.level).toBe('info')
  })

  it('attaches the service base field', () => {
    const logger = createLogger(baseConfig)
    expect(logger.bindings()).toMatchObject({ service: 'code-rouge-server' })
  })
})

describe('createLogger — redact surface (defense-in-depth)', () => {
  it('redacts a top-level draftAuthCode', () => {
    const { logger, lines } = captureLogger()
    logger.info({ draftAuthCode: 'SECRET-CODE-1234' }, 'evt')
    const [entry] = lines() as Array<Record<string, unknown>>
    expect(entry).toMatchObject({ draftAuthCode: '[REDACTED]', msg: 'evt' })
  })

  it('redacts draftAuthCode under any one-level-deep parent (wildcard)', () => {
    const { logger, lines } = captureLogger()
    const cases = [
      { parent: 'state', value: 'a' },
      { parent: 'payload', value: 'b' },
      { parent: 'body', value: 'c' },
      { parent: 'frame', value: 'd' },
    ] as const
    for (const c of cases) {
      logger.info({ [c.parent]: { draftAuthCode: c.value } }, `${c.parent}-branch`)
    }
    const entries = lines() as Array<Record<string, unknown>>
    expect(entries).toHaveLength(cases.length)
    for (let i = 0; i < cases.length; i += 1) {
      const entry = entries[i]
      const parent = cases[i]?.parent
      if (entry === undefined || parent === undefined) {
        throw new Error(`missing case at index ${i}`)
      }
      const branch = entry[parent] as Record<string, unknown>
      expect(branch['draftAuthCode']).toBe('[REDACTED]')
    }
  })

  it('does NOT redact unrelated fields (no over-eager matching)', () => {
    const { logger, lines } = captureLogger()
    logger.info({ teamId: 7, step: 'phishing', deviceId: 'tablet-7' }, 'evt')
    const [entry] = lines() as Array<Record<string, unknown>>
    expect(entry).toMatchObject({ teamId: 7, step: 'phishing', deviceId: 'tablet-7' })
    expect(JSON.stringify(entry)).not.toContain('[REDACTED]')
  })
})
