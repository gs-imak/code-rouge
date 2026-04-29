import { randomBytes, randomInt } from 'node:crypto'

// Session id is recorded for the lifetime of the server process. POST
// /admin/reset (chantier 04+) starts a new session. Format is human-grokkable
// for grep over /var/log/code-rouge/server.log: "session-2026-04-29T1234-7f3a".
export function newSessionId(now: Date = new Date()): string {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\..*/, '')
  return `session-${stamp}-${randomBytes(2).toString('hex')}`
}

// 6-digit numeric so the GM can read it off the Débriefing screen.
// `crypto.randomInt(min, max)` is bias-free across the [min, max) range —
// avoids the modulo bias of `randomBytes(4).readUInt32BE() % 900_000`.
export function newResetCode(): string {
  return String(randomInt(100_000, 1_000_000))
}
