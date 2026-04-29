import { randomBytes } from 'node:crypto'

// Session id is recorded for the lifetime of the server process. POST
// /admin/reset (chantier 04+) starts a new session. Format is human-grokkable
// for grep over /var/log/code-rouge/server.log: "session-2026-04-29T1234-7f3a".
export function newSessionId(now: Date = new Date()): string {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\..*/, '')
  return `session-${stamp}-${randomBytes(2).toString('hex')}`
}

// 6-digit numeric so the GM can read it off the Débriefing screen.
export function newResetCode(): string {
  // randomInt range is exclusive on max; 100_000..999_999 inclusive.
  const n = randomBytes(4).readUInt32BE() % 900_000
  return String(100_000 + n)
}
