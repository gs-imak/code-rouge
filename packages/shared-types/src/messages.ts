// WebSocket message contracts — single source of truth for the wire format
// between the three apps (attaque-de-bots, assaut, debriefing) and the NUC server.
//
// The server validates every inbound payload via parseAppToServerMessage before
// touching state (per docs/conventions/server-nuc.md). The apps validate incoming
// frames via parseServerToAppMessage.
//
// Schemas of record live here; never define message shapes inside an app or
// the server package.

import { z } from 'zod'

// -------------------------------------------------------------------- Primitives

export const AppName = z.enum(['attaque-de-bots', 'assaut', 'debriefing'])
export type AppName = z.infer<typeof AppName>

export const DeviceId = z.string().min(1).max(64)
export type DeviceId = z.infer<typeof DeviceId>

// `null` until the team-select screen runs; non-negative int after.
export const TeamId = z.number().int().nonnegative().nullable()
export type TeamId = z.infer<typeof TeamId>

// Bounded so a malicious or buggy client can't push 100 MB of "log" through.
// `data` is a string-keyed bag of JSON primitives — no nested objects, no
// arrays, no arbitrary trees. Per-key value capped at 256 chars; whole
// object capped at 16 keys. If a future event needs richer data, add a
// new event kind with its own dedicated schema rather than widening this.
export const LogEvent = z.object({
  at: z.number().int().nonnegative(),
  kind: z.string().min(1).max(64),
  data: z
    .record(z.union([z.string().max(256), z.number(), z.boolean(), z.null()]))
    .refine((v) => Object.keys(v).length <= 16, { message: 'data: max 16 keys' })
    .optional(),
})
export type LogEvent = z.infer<typeof LogEvent>

// -------------------------------------------------------------------- App → Server

export const HelloMessage = z.object({
  type: z.literal('hello'),
  app: AppName,
  deviceId: DeviceId,
  teamId: TeamId,
  // Optional reconnection hint: if set, server can decide whether to send a
  // RestoreMessage or accept the app's current state.
  lastKnownStep: z.string().min(1).max(128).optional(),
})
export type HelloMessage = z.infer<typeof HelloMessage>

export const StateUpdateMessage = z.object({
  type: z.literal('state'),
  app: AppName,
  deviceId: DeviceId,
  teamId: TeamId,
  step: z.string().min(1).max(128),
  // Score is non-negative by construction. Without this floor, a buggy
  // app or replayed payload could push a negative score, and reconcile()
  // accepts it on the local-init branch (no Math.max guard there).
  score: z.number().int().nonnegative(),
  timestamp: z.number().int().nonnegative(),
})
export type StateUpdateMessage = z.infer<typeof StateUpdateMessage>

// `events` is non-empty so we don't accept a no-op log push.
export const LogPushMessage = z.object({
  type: z.literal('log'),
  app: AppName,
  deviceId: DeviceId,
  teamId: TeamId,
  events: z.array(LogEvent).min(1).max(1000),
})
export type LogPushMessage = z.infer<typeof LogPushMessage>

export const PongMessage = z.object({
  type: z.literal('pong'),
  app: AppName,
  deviceId: DeviceId,
  timestamp: z.number().int().nonnegative(),
})
export type PongMessage = z.infer<typeof PongMessage>

// ---- Access-point approval + MG authorisation code (Assaut ↔ GM) -----------
//
// Low-volume, GM-mediated exchanges (a handful per game — within the WS remit,
// immutable rule #5; not high-frequency or media). The « point d'accès » loop:
// a team's Assaut app SUBMITS an entry point → the server relays it to the GM
// (Débriefing) app → the GM rules on it (access-decision) → the server relays
// the verdict back to that team (access-result), driving the Validation/Refus
// screens. The « attente code MG » loop: the GM SETS the authorisation code
// (mg-code-set) → the server relays it to the waiting team (mg-code).

export const AccessDecision = z.enum(['approved', 'refused'])
export type AccessDecision = z.infer<typeof AccessDecision>

// App → Server: a team's Assaut app submits an entry point for GM approval.
export const AccessSubmitMessage = z.object({
  type: z.literal('access-submit'),
  app: AppName,
  deviceId: DeviceId,
  teamId: TeamId,
  point: z.string().min(1).max(128),
})
export type AccessSubmitMessage = z.infer<typeof AccessSubmitMessage>

// App → Server: the GM (Débriefing) app rules on a team's submission. The server
// relays it to that team as an AccessResultMessage.
export const AccessDecisionMessage = z.object({
  type: z.literal('access-decision'),
  app: AppName,
  deviceId: DeviceId,
  targetTeamId: z.number().int().nonnegative(),
  decision: AccessDecision,
  // Optional label of the validated option (e.g. « Toits »), shown on success.
  label: z.string().max(128).optional(),
})
export type AccessDecisionMessage = z.infer<typeof AccessDecisionMessage>

// App → Server: the GM sets the authorisation code a team is waiting for.
export const McodeSetMessage = z.object({
  type: z.literal('mg-code-set'),
  app: AppName,
  deviceId: DeviceId,
  targetTeamId: z.number().int().nonnegative(),
  code: z.string().min(1).max(64),
})
export type McodeSetMessage = z.infer<typeof McodeSetMessage>

// ---- Débriefing aggregation (GM ↔ server) ---------------------------------
//
// At end of session the Débriefing (GM) app pulls every team's event log from
// the server to compute stats + slides. The server is the source of truth: each
// player app pushes its log (LogPushMessage) during/at end of play, so the data
// survives a tablet going offline afterwards (see docs/adr/0002). These requests
// are GM-only — the server rejects them from non-débriefing apps so a player
// cannot read another team's log.

// App → Server: list the teams known this session.
export const TeamsRequestMessage = z.object({
  type: z.literal('teams-request'),
  app: AppName,
  deviceId: DeviceId,
})
export type TeamsRequestMessage = z.infer<typeof TeamsRequestMessage>

// App → Server: pull one team's full event log.
export const LogRequestMessage = z.object({
  type: z.literal('log-request'),
  app: AppName,
  deviceId: DeviceId,
  targetTeamId: z.number().int().nonnegative(),
})
export type LogRequestMessage = z.infer<typeof LogRequestMessage>

export const AppToServerMessage = z.discriminatedUnion('type', [
  HelloMessage,
  StateUpdateMessage,
  LogPushMessage,
  PongMessage,
  AccessSubmitMessage,
  AccessDecisionMessage,
  McodeSetMessage,
  TeamsRequestMessage,
  LogRequestMessage,
])
export type AppToServerMessage = z.infer<typeof AppToServerMessage>

// -------------------------------------------------------------------- Server → App

export const WelcomeMessage = z.object({
  type: z.literal('welcome'),
  teamId: z.number().int().nonnegative(),
  sessionId: z.string().min(1).max(64),
  serverTime: z.number().int().nonnegative(),
})
export type WelcomeMessage = z.infer<typeof WelcomeMessage>

export const RestoreMessage = z.object({
  type: z.literal('restore'),
  teamId: z.number().int().nonnegative(),
  app: AppName,
  step: z.string().min(1).max(128),
  // Score floor matches StateUpdateMessage. The reconcile() function
  // additionally Math.max-clamps when local has progressed past 'init',
  // but if local is still at 'init' the server's value wins outright;
  // a non-negative floor ensures it cannot regress below zero either.
  score: z.number().int().nonnegative(),
  timestamp: z.number().int().nonnegative(),
})
export type RestoreMessage = z.infer<typeof RestoreMessage>

export const ServerCommandMessage = z.object({
  type: z.literal('cmd'),
  cmd: z.enum(['ping', 'reset', 'sync', 'shutdown']),
})
export type ServerCommandMessage = z.infer<typeof ServerCommandMessage>

// Server → App: the GM's verdict on this team's access-point submission. Drives
// the Validation (« Félicitations ») / Refus (« Échec ») screens on Assaut.
export const AccessResultMessage = z.object({
  type: z.literal('access-result'),
  decision: AccessDecision,
  label: z.string().max(128).optional(),
})
export type AccessResultMessage = z.infer<typeof AccessResultMessage>

// Server → App: the authorisation code the team was waiting for (« attente code MG »).
export const McodeMessage = z.object({
  type: z.literal('mg-code'),
  code: z.string().min(1).max(64),
})
export type McodeMessage = z.infer<typeof McodeMessage>

// Server → Débriefing (GM): a team submitted an entry point and awaits a verdict.
// The server forwards every AccessSubmitMessage to the GM app so it can surface
// the pending submission and rule on it (→ access-decision). `teamId` is concrete —
// submissions from an app with no team assigned are dropped server-side (nothing to
// rule on). Broadcast to all débriefing clients (there may be a backup GM device).
export const AccessPendingMessage = z.object({
  type: z.literal('access-pending'),
  teamId: z.number().int().nonnegative(),
  point: z.string().min(1).max(128),
})
export type AccessPendingMessage = z.infer<typeof AccessPendingMessage>

// Server → Débriefing: the teams known this session (those with state and/or a
// log). `apps` is which apps reported for the team (attaque-de-bots / assaut).
export const TeamSummary = z.object({
  teamId: z.number().int().nonnegative(),
  apps: z.array(AppName),
})
export type TeamSummary = z.infer<typeof TeamSummary>

export const TeamsResultMessage = z.object({
  type: z.literal('teams'),
  teams: z.array(TeamSummary).max(64),
})
export type TeamsResultMessage = z.infer<typeof TeamsResultMessage>

// Server → Débriefing: a team's full event log, read from the server store.
export const LogResultMessage = z.object({
  type: z.literal('log-result'),
  teamId: z.number().int().nonnegative(),
  events: z.array(LogEvent).max(5000),
})
export type LogResultMessage = z.infer<typeof LogResultMessage>

export const ServerToAppMessage = z.discriminatedUnion('type', [
  WelcomeMessage,
  RestoreMessage,
  ServerCommandMessage,
  AccessResultMessage,
  McodeMessage,
  AccessPendingMessage,
  TeamsResultMessage,
  LogResultMessage,
])
export type ServerToAppMessage = z.infer<typeof ServerToAppMessage>

// -------------------------------------------------------------------- Parsing

export class MessageParseError extends Error {
  override readonly name = 'MessageParseError'
  // `cause` is already declared on Error in lib.es2022.error.d.ts; mark override.
  override readonly cause?: unknown
  constructor(message: string, cause?: unknown) {
    super(message)
    this.cause = cause
  }
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch (cause) {
    throw new MessageParseError('invalid JSON', cause)
  }
}

export function parseAppToServerMessage(raw: string): AppToServerMessage {
  const json = parseJson(raw)
  const result = AppToServerMessage.safeParse(json)
  if (!result.success) {
    throw new MessageParseError(`AppToServerMessage schema mismatch: ${result.error.message}`, result.error)
  }
  return result.data
}

export function parseServerToAppMessage(raw: string): ServerToAppMessage {
  const json = parseJson(raw)
  const result = ServerToAppMessage.safeParse(json)
  if (!result.success) {
    throw new MessageParseError(`ServerToAppMessage schema mismatch: ${result.error.message}`, result.error)
  }
  return result.data
}

// `parseMessage` is the App → Server entry point — server-side default.
// Apps consuming Server → App frames use parseServerToAppMessage explicitly.
export const parseMessage = parseAppToServerMessage

// -------------------------------------------------------------------- GameState
// Persisted-on-the-app shape. Mirrors `team_state` row fields the apps care
// about (cross-app fields like sessionId stay server-side). Defaults applied
// via Zod so a fresh app boot with empty storage still parses to a valid
// state — no nullable currentStep or score wandering into render code.

export const GameState = z.object({
  // Per-app stable identifier. Generated once on first boot via
  // `randomDeviceId()` (shared-utils) and persisted; the empty default
  // lets a fresh parse succeed before generation runs.
  // KNOWN: random per-install (not hardware-derived). A `pm clear` wipes
  // it and the server-side restore-by-deviceId can't find the team. Real
  // hardware IDs land via a native module in chantier 06+.
  deviceId: z.string().max(64).default(''),
  teamId: TeamId.default(null),
  currentStep: z.string().min(1).max(128).default('init'),
  score: z.number().int().default(0),
  lastSync: z.number().int().nonnegative().default(0),
  // In-progress input that should survive a force-kill (the auth code on
  // assaut, the team-id draft on attaque-de-bots before they hit Valider).
  // Cleared once the value is validated and committed to a real field.
  draftAuthCode: z.string().max(64).default(''),
  // NUC server IP/host the GM has configured. Used by debriefing's Setup
  // admin screen and (chantier 06+) propagated to player devices via mDNS
  // discovery or a build-time bake. Default localhost for the dev/visio
  // single-machine demo.
  serverIp: z.string().min(1).max(64).default('127.0.0.1'),
})
export type GameState = z.infer<typeof GameState>

export const DEFAULT_GAME_STATE: GameState = GameState.parse({})

// Reconciliation policy when both server (RestoreMessage) and local
// (persisted GameState) carry a value:
//   - server wins for `teamId` (the GM may have re-assigned teams)
//   - app wins for `currentStep` and `score` (app may have made progress
//     while disconnected; server hadn't yet seen the latest state push)
// `lastSync` is overwritten with `Date.now()` after every reconcile.
export function reconcile(local: GameState, restore: RestoreMessage): GameState {
  const localMadeProgress = local.currentStep !== 'init'
  return {
    deviceId: local.deviceId,
    teamId: restore.teamId,
    // Server's `step` wins iff the local state never made progress past
    // 'init'. Otherwise the app may have gone further while disconnected;
    // app keeps its currentStep and pushes a fresh state up on reconnect.
    currentStep: localMadeProgress ? local.currentStep : restore.step,
    // For score, take the larger of the two when the app has made local
    // progress — protects against a visible score regression mid-demo
    // when the server's last push happens to carry a higher score than
    // the local one (e.g. an unflushed StateUpdate before a force-stop).
    // When the app is still at init, take the server's value.
    score: localMadeProgress ? Math.max(local.score, restore.score) : restore.score,
    lastSync: Date.now(),
    // Drafts are local-only — the server never sees uncommitted input.
    draftAuthCode: local.draftAuthCode,
    // NUC IP is purely client-side configuration; the server has no
    // authority over where the GM has pointed the tablet.
    serverIp: local.serverIp,
  }
}
