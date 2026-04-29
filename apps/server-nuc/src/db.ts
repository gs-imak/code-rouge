import Database, { type Database as DatabaseType } from 'better-sqlite3'
import { readFileSync, readdirSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Logger } from 'pino'
import type {
  LogPushMessage,
  StateUpdateMessage,
} from '@code-rouge/shared-types'
import type { ServerConfig } from './config.js'

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations')

export interface TeamStateRow {
  readonly session_id: string
  readonly team_id: number
  readonly app: string
  readonly device_id: string
  readonly step: string
  readonly score: number
  readonly timestamp: number
}

export interface DbHandle {
  readonly upsertTeamState: (sessionId: string, msg: StateUpdateMessage) => boolean
  readonly appendLogEvents: (sessionId: string, msg: LogPushMessage) => number
  readonly getTeamState: (
    sessionId: string,
    teamId: number,
    app: string,
  ) => TeamStateRow | undefined
  /**
   * Find the most recent team_state row for a given device — used to
   * restore a tablet that's lost its local storage. Scans across all
   * sessions; the venue typically has one active session at a time so
   * this returns the right row even when the device "remembers" through
   * a session boundary. Bounded by team_state row count (≤ 36 typical).
   */
  readonly getTeamStateByDevice: (
    deviceId: string,
    app: string,
  ) => TeamStateRow | undefined
  readonly ensureSession: (sessionId: string, resetCode: string) => void
  // Cheap liveness check used by /health. Hoisted prepared statement,
  // no per-call compile cost.
  readonly ping: () => void
  readonly close: () => void
}

function runMigrations(db: DatabaseType, logger: Logger): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name        TEXT    PRIMARY KEY NOT NULL,
      applied_at  INTEGER NOT NULL
    ) STRICT
  `)
  const applied = new Set(
    db.prepare<unknown[], { name: string }>('SELECT name FROM _migrations').all().map((r) => r.name),
  )
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()
  const insertMigration = db.prepare(
    'INSERT INTO _migrations (name, applied_at) VALUES (?, ?)',
  )
  for (const file of files) {
    if (applied.has(file)) continue
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8')
    db.transaction(() => {
      db.exec(sql)
      insertMigration.run(file, Date.now())
    })()
    logger.info({ migration: file }, 'migration applied')
  }
}

export function openDb(config: ServerConfig, logger: Logger): DbHandle {
  // Ensure the parent directory exists. SQLite itself creates the file.
  mkdirSync(dirname(config.databasePath), { recursive: true })

  const db = new Database(config.databasePath)
  db.pragma('journal_mode = WAL') // concurrent readers, durable across OS crash
  db.pragma('foreign_keys = ON')
  // FULL sync (not NORMAL) — chantier 05 demos a hard force-reboot during
  // step 3 of the team flow. NORMAL leaves a small window where a committed
  // upsert may not survive sudden power loss; FULL fsyncs the WAL on every
  // commit. The performance cost on a NUC SSD at our write rate (≤ 1 upsert
  // per team per second) is invisible.
  db.pragma('synchronous = FULL')
  db.pragma('cache_size = -32768') // 32 MB page cache (negative = KiB unit)
  db.pragma('temp_store = MEMORY') // intermediates in RAM, not /tmp

  runMigrations(db, logger)

  const upsertTeamStateStmt = db.prepare(`
    INSERT INTO team_state (session_id, team_id, app, device_id, step, score, timestamp)
    VALUES (@sessionId, @teamId, @app, @deviceId, @step, @score, @timestamp)
    ON CONFLICT (session_id, team_id, app) DO UPDATE SET
      device_id = excluded.device_id,
      step      = excluded.step,
      score     = excluded.score,
      timestamp = excluded.timestamp
    WHERE excluded.timestamp >= team_state.timestamp
  `)

  const insertLogStmt = db.prepare(`
    INSERT INTO event_log (session_id, team_id, app, device_id, at, kind, data)
    VALUES (@sessionId, @teamId, @app, @deviceId, @at, @kind, @data)
  `)

  const insertLogTx = db.transaction(
    (sessionId: string, teamId: number, msg: LogPushMessage): number => {
      let inserted = 0
      for (const ev of msg.events) {
        insertLogStmt.run({
          sessionId,
          teamId,
          app: msg.app,
          deviceId: msg.deviceId,
          at: ev.at,
          kind: ev.kind,
          data: ev.data === undefined ? null : JSON.stringify(ev.data),
        })
        inserted += 1
      }
      return inserted
    },
  )

  const getTeamStateStmt = db.prepare<
    { sessionId: string; teamId: number; app: string },
    TeamStateRow
  >(`
    SELECT session_id, team_id, app, device_id, step, score, timestamp
    FROM team_state
    WHERE session_id = @sessionId AND team_id = @teamId AND app = @app
  `)

  // ORDER BY timestamp DESC so a device that was on team 4 last week and
  // got reassigned to team 7 today gets the team-7 row.
  const getTeamStateByDeviceStmt = db.prepare<
    { deviceId: string; app: string },
    TeamStateRow
  >(`
    SELECT session_id, team_id, app, device_id, step, score, timestamp
    FROM team_state
    WHERE device_id = @deviceId AND app = @app
    ORDER BY timestamp DESC
    LIMIT 1
  `)

  const ensureSessionStmt = db.prepare(`
    INSERT OR IGNORE INTO sessions (id, started_at, reset_code)
    VALUES (?, ?, ?)
  `)

  // Hoisted out of /health so the route doesn't pay tsc compile cost on
  // every poll (apps poll every 5s; 36 polls/min indefinitely).
  const pingStmt = db.prepare('SELECT 1 AS ok')

  return {
    upsertTeamState(sessionId, msg) {
      if (msg.teamId === null) return false // team not yet selected — caller logs and skips
      const result = upsertTeamStateStmt.run({
        sessionId,
        teamId: msg.teamId,
        app: msg.app,
        deviceId: msg.deviceId,
        step: msg.step,
        score: msg.score,
        timestamp: msg.timestamp,
      })
      return result.changes > 0
    },
    appendLogEvents(sessionId, msg) {
      if (msg.teamId === null) return 0
      return insertLogTx(sessionId, msg.teamId, msg)
    },
    getTeamState(sessionId, teamId, app) {
      return getTeamStateStmt.get({ sessionId, teamId, app })
    },
    getTeamStateByDevice(deviceId, app) {
      return getTeamStateByDeviceStmt.get({ deviceId, app })
    },
    ensureSession(sessionId, resetCode) {
      ensureSessionStmt.run(sessionId, Date.now(), resetCode)
    },
    ping() {
      pingStmt.get()
    },
    close() {
      // Flush the WAL so a hard power-loss right after shutdown can't lose
      // the tail of the session. Cheap on shutdown; won't run mid-session.
      try {
        db.pragma('wal_checkpoint(TRUNCATE)')
      } catch {
        // already closing — ignore
      }
      db.close()
    },
  }
}
