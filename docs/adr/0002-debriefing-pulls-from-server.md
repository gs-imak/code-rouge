# Débriefing pulls team logs from the NUC, not app-to-app

**Status:** accepted (M3, 2026-06-05)

## Decision

At end of session the Débriefing (GM) app aggregates every team's event log by
pulling it **from the NUC server's SQLite store**, over WebSocket, via two
additive GM-only messages: `teams-request` → `teams` (the session's teams) then
`log-request` → `log-result` (one team's full event log). The server already
persists every `LogPushMessage` into `event_log`; the new read-path
(`db.getTeamSummaries` / `db.getEventLog`) serves it back. The stats are computed
client-side by a pure engine (`apps/debriefing/src/stats`).

## Why (the trade-off)

The cahier des charges describes the GM app "pulling each team's log and retrying
offline apps". The literal reading is **app-to-app** relay (GM → server → team's
tablet → reply). Rejected:

- A tablet that finished and was powered off (common at debrief time) would have
  no log to give — yet the server already holds it. App-to-app makes the data
  hostage to device liveness.
- It needs a request/response relay routed by teamId across two hops, with
  per-team timeouts and partial-failure handling on the wire.

Server-pull is simpler and strictly more robust: the player apps push their log
during/at end of play (the `pushLog` seam), so the server is the source of truth.
A team that never pushed comes back with an empty log → the GM app reports "logs
missing: équipe N" (the retry/again affordance lives in the GM UI, not the wire).

## Consequences

- New WS messages are **additive** to the discriminated unions (existing parsers
  unaffected) — but they ARE a WebSocket-protocol change (a load-bearing area):
  recorded here per immutable rule + Senior-Reviewer #11.
- Log reads are **GM-only**: the server rejects `teams-request` / `log-request`
  from any app !== `debriefing`, so a player can't exfiltrate another team's log
  off the LAN. (Same posture as the cross-session restore guard.)
- Freshness: the GM sees what was last pushed. A team still mid-play shows a
  partial log. For a between-sessions debrief tool this is correct.
- If a future requirement genuinely needs live app-to-app pull (e.g. logs never
  pushed), the relay can be added alongside without removing this path.
