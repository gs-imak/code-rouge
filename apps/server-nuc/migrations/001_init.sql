-- chantier 03.3 — initial schema for Code Rouge.
-- Append-only: never edit a deployed migration. Add 002_*.sql, 003_*.sql, etc.

PRAGMA foreign_keys = ON;

-- A "session" is one playthrough cohort: one game master shift, twelve teams,
-- one venue. Server creates one on boot if none is active. POST /admin/reset
-- (chantier 04+) ends the current and starts a new one.
CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT    PRIMARY KEY NOT NULL,
  started_at  INTEGER NOT NULL,        -- ms epoch
  ended_at    INTEGER,                 -- ms epoch, NULL while active
  reset_code  TEXT    NOT NULL         -- per-session admin code (shown on Débriefing)
) STRICT;

-- Latest-known UI state per (session, team, app). Upserted on every
-- StateUpdateMessage. The server is authoritative for cross-app fields
-- (teamId), the app is authoritative for its own step/score.
CREATE TABLE IF NOT EXISTS team_state (
  session_id  TEXT    NOT NULL,
  team_id     INTEGER NOT NULL,
  app         TEXT    NOT NULL,        -- attaque-de-bots | assaut | debriefing
  device_id   TEXT    NOT NULL,
  step        TEXT    NOT NULL,
  score       INTEGER NOT NULL,
  timestamp   INTEGER NOT NULL,        -- ms epoch when the app emitted the update
  PRIMARY KEY (session_id, team_id, app),
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
) STRICT;

CREATE INDEX IF NOT EXISTS idx_team_state_team ON team_state(team_id);

-- Append-only event log, one row per LogEvent inside a LogPushMessage.
-- Read-heavy at debrief time (the GM's app slurps all events for the session).
CREATE TABLE IF NOT EXISTS event_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  TEXT    NOT NULL,
  team_id     INTEGER NOT NULL,
  app         TEXT    NOT NULL,
  device_id   TEXT    NOT NULL,
  at          INTEGER NOT NULL,        -- ms epoch when the app captured the event
  kind        TEXT    NOT NULL,        -- short identifier ("phishing-clicked", etc.)
  data        TEXT,                    -- JSON-serialised payload, NULL when none
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);
-- AUTOINCREMENT requires non-STRICT (rowid alias is implicitly INTEGER PRIMARY KEY).
-- Keep this table relaxed; the strict tables above protect the load-bearing fields.

CREATE INDEX IF NOT EXISTS idx_event_log_session_team_at
  ON event_log(session_id, team_id, at);
