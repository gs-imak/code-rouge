import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import pino from 'pino'
import { openDb, type DbHandle } from './db.js'
import type { ServerConfig } from './config.js'

// In-memory SQLite would be cleaner but the migration runner reads SQL
// files via `dirname(fileURLToPath(import.meta.url))` and uses
// `mkdirSync(dirname(databasePath), …)` — both expect a real path. Each
// test gets a fresh temp dir → fresh DB file → migrations run from
// scratch. Cheap (better-sqlite3 is fast, migrations are two SQL files)
// and isolates ordering hazards.

const silentLogger = pino({ level: 'silent' })

let tempDir: string
let db: DbHandle

function makeConfig(): ServerConfig {
  return {
    host: '127.0.0.1',
    port: 0,
    databasePath: join(tempDir, 'test.sqlite'),
    logLevel: 'fatal',
    nodeEnv: 'test',
  }
}

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'cr-db-test-'))
  db = openDb(makeConfig(), silentLogger)
  db.ensureSession('sess-test', 'reset-code-test')
})

afterEach(() => {
  db.close()
  rmSync(tempDir, { recursive: true, force: true })
})

describe('upsertTeamState', () => {
  it('inserts a fresh row and returns true', () => {
    const ok = db.upsertTeamState('sess-test', {
      type: 'state',
      app: 'attaque-de-bots',
      deviceId: 'tablet-7',
      teamId: 7,
      step: 'phishing',
      score: 12,
      timestamp: 1000,
    })
    expect(ok).toBe(true)
    const row = db.getTeamState('sess-test', 7, 'attaque-de-bots')
    expect(row).toMatchObject({ step: 'phishing', score: 12, device_id: 'tablet-7' })
  })

  it('overwrites with a newer timestamp', () => {
    db.upsertTeamState('sess-test', {
      type: 'state',
      app: 'attaque-de-bots',
      deviceId: 'tablet-7',
      teamId: 7,
      step: 'phishing',
      score: 12,
      timestamp: 1000,
    })
    db.upsertTeamState('sess-test', {
      type: 'state',
      app: 'attaque-de-bots',
      deviceId: 'tablet-7',
      teamId: 7,
      step: 'mailbox',
      score: 25,
      timestamp: 2000,
    })
    expect(db.getTeamState('sess-test', 7, 'attaque-de-bots')).toMatchObject({
      step: 'mailbox',
      score: 25,
      timestamp: 2000,
    })
  })

  it('refuses to overwrite with an older timestamp (out-of-order WS frames)', () => {
    db.upsertTeamState('sess-test', {
      type: 'state',
      app: 'attaque-de-bots',
      deviceId: 'tablet-7',
      teamId: 7,
      step: 'mailbox',
      score: 25,
      timestamp: 2000,
    })
    db.upsertTeamState('sess-test', {
      type: 'state',
      app: 'attaque-de-bots',
      deviceId: 'tablet-7',
      teamId: 7,
      step: 'phishing',
      score: 12,
      timestamp: 1000, // older — rejected
    })
    expect(db.getTeamState('sess-test', 7, 'attaque-de-bots')).toMatchObject({
      step: 'mailbox',
      score: 25,
    })
  })
})

describe('appendLogEvents', () => {
  it('appends every event in the batch and returns the count', () => {
    const inserted = db.appendLogEvents('sess-test', {
      type: 'log',
      app: 'attaque-de-bots',
      deviceId: 'tablet-7',
      teamId: 7,
      events: [
        { at: 1000, kind: 'step.entered', data: { step: 'phishing' } },
        { at: 1500, kind: 'click.email' },
        { at: 2000, kind: 'step.entered', data: { step: 'mailbox' } },
      ],
    })
    expect(inserted).toBe(3)
  })

  it('handles undefined `data` by storing NULL (read back as {at, kind})', () => {
    db.appendLogEvents('sess-test', {
      type: 'log',
      app: 'attaque-de-bots',
      deviceId: 'tablet-7',
      teamId: 7,
      events: [{ at: 1000, kind: 'click.email' }],
    })
    expect(db.getEventLog('sess-test', 7)).toEqual([{ at: 1000, kind: 'click.email' }])
  })
})

describe('getTeamSummaries', () => {
  it('returns distinct teams with their reporting apps, sorted by teamId', () => {
    db.upsertTeamState('sess-test', { type: 'state', app: 'attaque-de-bots', deviceId: 't7', teamId: 7, step: 'a-mdp', score: 100, timestamp: 1000 })
    db.upsertTeamState('sess-test', { type: 'state', app: 'assaut', deviceId: 'pc7', teamId: 7, step: 'debut', score: 0, timestamp: 1000 })
    db.upsertTeamState('sess-test', { type: 'state', app: 'attaque-de-bots', deviceId: 't3', teamId: 3, step: 'a-mailbox', score: 0, timestamp: 1000 })
    const summaries = db.getTeamSummaries('sess-test')
    expect(summaries.map((s) => s.teamId)).toEqual([3, 7])
    expect([...(summaries.find((s) => s.teamId === 7)?.apps ?? [])].sort()).toEqual(['assaut', 'attaque-de-bots'])
    expect(summaries.find((s) => s.teamId === 3)?.apps).toEqual(['attaque-de-bots'])
  })

  it('includes a team that only has a log (no state row)', () => {
    db.appendLogEvents('sess-test', { type: 'log', app: 'attaque-de-bots', deviceId: 't9', teamId: 9, events: [{ at: 1, kind: 'session-complete', data: { score: 50 } }] })
    expect(db.getTeamSummaries('sess-test').map((s) => s.teamId)).toContain(9)
  })

  it('is scoped to the session', () => {
    db.ensureSession('sess-other', 'rc')
    db.upsertTeamState('sess-other', { type: 'state', app: 'attaque-de-bots', deviceId: 't1', teamId: 1, step: 'x', score: 0, timestamp: 1 })
    expect(db.getTeamSummaries('sess-test')).toEqual([])
  })
})

describe('getEventLog', () => {
  it("returns a team's events oldest-first, round-tripping data", () => {
    db.appendLogEvents('sess-test', {
      type: 'log',
      app: 'attaque-de-bots',
      deviceId: 't7',
      teamId: 7,
      events: [
        { at: 2000, kind: 'enigme-solved', data: { step: 'a-mdp', attempts: 2 } },
        { at: 1000, kind: 'phishing-clicked', data: { mail: 'phishing-update-creds' } },
        { at: 3000, kind: 'session-complete', data: { score: 350 } },
      ],
    })
    const log = db.getEventLog('sess-test', 7)
    expect(log.map((e) => e.at)).toEqual([1000, 2000, 3000])
    expect(log[0]).toEqual({ at: 1000, kind: 'phishing-clicked', data: { mail: 'phishing-update-creds' } })
    expect(log[1]?.data).toEqual({ step: 'a-mdp', attempts: 2 })
  })

  it('returns [] for a team with no events', () => {
    expect(db.getEventLog('sess-test', 42)).toEqual([])
  })
})

describe('getTeamStateByDevice', () => {
  it('returns undefined when no row exists for the device', () => {
    expect(db.getTeamStateByDevice('sess-test', 'unknown-device', 'attaque-de-bots')).toBeUndefined()
  })

  it('returns the seeded row after upsert', () => {
    db.upsertTeamState('sess-test', {
      type: 'state',
      app: 'attaque-de-bots',
      deviceId: 'tablet-7',
      teamId: 7,
      step: 'phishing',
      score: 12,
      timestamp: 1000,
    })
    expect(db.getTeamStateByDevice('sess-test', 'tablet-7', 'attaque-de-bots')).toMatchObject({
      team_id: 7,
      step: 'phishing',
      score: 12,
    })
  })

  it('is scoped to sessionId — does not leak across sessions (chantier 05 P1 fix)', () => {
    db.ensureSession('sess-other', 'reset-code-other')
    db.upsertTeamState('sess-other', {
      type: 'state',
      app: 'attaque-de-bots',
      deviceId: 'tablet-7',
      teamId: 4,
      step: 'mailbox',
      score: 20,
      timestamp: 1000,
    })
    // Same deviceId, different session → must be invisible.
    expect(
      db.getTeamStateByDevice('sess-test', 'tablet-7', 'attaque-de-bots'),
    ).toBeUndefined()
    // The owning session can still read it.
    expect(
      db.getTeamStateByDevice('sess-other', 'tablet-7', 'attaque-de-bots'),
    ).toMatchObject({ team_id: 4, step: 'mailbox' })
  })

  it('discriminates between apps with the same deviceId (different installs)', () => {
    db.upsertTeamState('sess-test', {
      type: 'state',
      app: 'attaque-de-bots',
      deviceId: 'shared-id',
      teamId: 7,
      step: 'phishing',
      score: 12,
      timestamp: 1000,
    })
    db.upsertTeamState('sess-test', {
      type: 'state',
      app: 'debriefing',
      deviceId: 'shared-id',
      teamId: 7,
      step: 'init',
      score: 0,
      timestamp: 1000,
    })
    expect(db.getTeamStateByDevice('sess-test', 'shared-id', 'attaque-de-bots')).toMatchObject({
      step: 'phishing',
    })
    expect(db.getTeamStateByDevice('sess-test', 'shared-id', 'debriefing')).toMatchObject({
      step: 'init',
    })
  })
})

describe('ping', () => {
  it('does not throw on a healthy db (used by /health)', () => {
    expect(() => db.ping()).not.toThrow()
  })
})

describe('resetSession', () => {
  it('deletes all team_state + event_log rows for the session and returns counts', () => {
    db.upsertTeamState('sess-test', {
      type: 'state',
      app: 'attaque-de-bots',
      deviceId: 'tablet-7',
      teamId: 7,
      step: 'phishing',
      score: 12,
      timestamp: 1000,
    })
    db.upsertTeamState('sess-test', {
      type: 'state',
      app: 'debriefing',
      deviceId: 'phone-gm',
      teamId: 7,
      step: 'init',
      score: 0,
      timestamp: 1000,
    })
    db.appendLogEvents('sess-test', {
      type: 'log',
      app: 'attaque-de-bots',
      deviceId: 'tablet-7',
      teamId: 7,
      events: [
        { at: 1000, kind: 'step.entered' },
        { at: 1500, kind: 'click.email' },
      ],
    })

    const result = db.resetSession('sess-test')
    expect(result.teamStateDeleted).toBe(2)
    expect(result.eventLogDeleted).toBe(2)

    expect(db.getTeamState('sess-test', 7, 'attaque-de-bots')).toBeUndefined()
    expect(db.getTeamStateByDevice('sess-test', 'tablet-7', 'attaque-de-bots')).toBeUndefined()
  })

  it('returns 0/0 when the session has no rows yet (idempotent)', () => {
    expect(db.resetSession('sess-test')).toEqual({
      teamStateDeleted: 0,
      eventLogDeleted: 0,
    })
  })

  it('does not delete other sessions', () => {
    db.ensureSession('sess-other', 'reset-other')
    db.upsertTeamState('sess-other', {
      type: 'state',
      app: 'attaque-de-bots',
      deviceId: 'tablet-3',
      teamId: 3,
      step: 'phishing',
      score: 5,
      timestamp: 1000,
    })
    db.upsertTeamState('sess-test', {
      type: 'state',
      app: 'attaque-de-bots',
      deviceId: 'tablet-7',
      teamId: 7,
      step: 'mailbox',
      score: 25,
      timestamp: 1000,
    })

    db.resetSession('sess-test')
    expect(db.getTeamState('sess-other', 3, 'attaque-de-bots')).toMatchObject({
      step: 'phishing',
      score: 5,
    })
  })
})
