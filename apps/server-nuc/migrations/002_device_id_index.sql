-- 002_device_id_index.sql
--
-- Adds an index on team_state(device_id, app) to support the
-- restore-by-device lookup added in chantier 05.3
-- (db.getTeamStateByDevice). Without it, that query is a full table
-- scan — harmless at venue scale today (≤36 rows per session) but
-- locked-in cost as sessions accumulate over the calendar year.

CREATE INDEX IF NOT EXISTS idx_team_state_device_app
  ON team_state(device_id, app);
