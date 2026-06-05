import Database, { type Database as DatabaseType } from 'better-sqlite3'
import { readFileSync, readdirSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Logger } from 'pino'
import {
  AppName,
  LogEvent,
  type LogPushMessage,
  type StateUpdateMessage,
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
   * Find the most recent team_state row for a given device within the
   * current session. Restoring across session boundaries was rejected
   * in security review — a player who sniffs a deviceId off the LAN
   * could otherwise read another team's prior-day progress by
   * connecting and submitting a Hello with that ID. Today's lookup is
   * scoped: cross-session leakage is closed; intra-session spoofing
   * still works (paired-deviceId HMAC challenge lands in chantier 06+).
   *
   * Indexed by `idx_team_state_device_app` (migration 002).
   */
  readonly getTeamStateByDevice: (
    sessionId: string,
    deviceId: string,
    app: string,
  ) => TeamStateRow | undefined
  /**
   * The teams known this session (from team_state and/or event_log), each with
   * the apps that reported for it. Used by the Débriefing app to discover teams
   * before pulling their logs. Apps that don't validate as AppName are dropped.
   */
  readonly getTeamSummaries: (
    sessionId: string,
  ) => ReadonlyArray<{ readonly teamId: number; readonly apps: readonly AppName[] }>
  /**
   * A team's full event log for the session, ordered oldest-first. The stored
   * `data` JSON is parsed + re-validated through LogEvent; rows that don't
   * validate are skipped rather than corrupting the response.
   */
  readonly getEventLog: (sessionId: string, teamId: number) => LogEvent[]
  readonly ensureSession: (sessionId: string, resetCode: string) => void
  /**
   * Wipe all team_state + event_log rows for a session — used by
   * POST /admin/reset when the GM ends a game and starts a fresh one
   * with the same teams/devices but clean progress. The session row
   * itself stays (so the resetCode remains valid for the same lifecycle);
   * only player-progress data is cleared. Returns the affected row counts
   * so the response can confirm the wipe to the GM.
   */
  readonly resetSession: (
    sessionId: string,
  ) => { readonly teamStateDeleted: number; readonly eventLogDeleted: number }
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

  // Scoped to session so a sniffed deviceId can't leak last-week's
  // team-4 progress when the device is on team 7 today. ORDER BY
  // timestamp DESC LIMIT 1 picks the latest row within the session.
  const getTeamStateByDeviceStmt = db.prepare<
    { sessionId: string; deviceId: string; app: string },
    TeamStateRow
  >(`
    SELECT session_id, team_id, app, device_id, step, score, timestamp
    FROM team_state
    WHERE session_id = @sessionId AND device_id = @deviceId AND app = @app
    ORDER BY timestamp DESC
    LIMIT 1
  `)

  // Débriefing aggregation: distinct (team, app) across state + log, and a
  // team's full ordered event log. UNION dedupes a team that appears in both.
  const getTeamRowsStmt = db.prepare<{ sessionId: string }, { team_id: number; app: string }>(`
    SELECT team_id, app FROM team_state WHERE session_id = @sessionId
    UNION
    SELECT team_id, app FROM event_log WHERE session_id = @sessionId
    ORDER BY team_id ASC, app ASC
  `)

  const getEventLogStmt = db.prepare<
    { sessionId: string; teamId: number },
    { at: number; kind: string; data: string | null }
  >(`
    SELECT at, kind, data FROM event_log
    WHERE session_id = @sessionId AND team_id = @teamId
    ORDER BY at ASC, rowid ASC
  `)

  const ensureSessionStmt = db.prepare(`
    INSERT OR IGNORE INTO sessions (id, started_at, reset_code)
    VALUES (?, ?, ?)
  `)

  // Two-statement transaction so a power loss between the deletes can't
  // leave team_state empty while event_log still references the session.
  const deleteTeamStateStmt = db.prepare(`DELETE FROM team_state WHERE session_id = ?`)
  const deleteEventLogStmt = db.prepare(`DELETE FROM event_log WHERE session_id = ?`)
  const resetSessionTx = db.transaction(
    (sessionId: string): { teamStateDeleted: number; eventLogDeleted: number } => ({
      teamStateDeleted: deleteTeamStateStmt.run(sessionId).changes,
      eventLogDeleted: deleteEventLogStmt.run(sessionId).changes,
    }),
  )

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
    getTeamStateByDevice(sessionId, deviceId, app) {
      return getTeamStateByDeviceStmt.get({ sessionId, deviceId, app })
    },
    getTeamSummaries(sessionId) {
      const byTeam = new Map<number, Set<AppName>>()
      for (const row of getTeamRowsStmt.all({ sessionId })) {
        const app = AppName.safeParse(row.app)
        if (!app.success) continue
        const set = byTeam.get(row.team_id) ?? new Set<AppName>()
        set.add(app.data)
        byTeam.set(row.team_id, set)
      }
      return [...byTeam.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([teamId, apps]) => ({ teamId, apps: [...apps] }))
    },
    getEventLog(sessionId, teamId) {
      const events: LogEvent[] = []
      for (const row of getEventLogStmt.all({ sessionId, teamId })) {
        let dataField: unknown
        if (row.data !== null) {
          try {
            dataField = JSON.parse(row.data)
          } catch {
            dataField = undefined
          }
        }
        const candidate =
          dataField === undefined
            ? { at: row.at, kind: row.kind }
            : { at: row.at, kind: row.kind, data: dataField }
        const parsed = LogEvent.safeParse(candidate)
        if (parsed.success) events.push(parsed.data)
      }
      return events
    },
    ensureSession(sessionId, resetCode) {
      ensureSessionStmt.run(sessionId, Date.now(), resetCode)
    },
    resetSession(sessionId) {
      return resetSessionTx(sessionId)
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
