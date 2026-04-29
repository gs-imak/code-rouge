// WebSocket message contracts — single source of truth for the wire format
// between the three apps (attaque-de-bots, assaut, debriefing) and the NUC server.
//
// The server validates every inbound payload via parseAppToServerMessage before
// touching state (per .claude/rules/server-nuc.md). The apps validate incoming
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
export const LogEvent = z.object({
  at: z.number().int().nonnegative(),
  kind: z.string().min(1).max(64),
  data: z.unknown().optional(),
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
  score: z.number().int(),
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

export const AppToServerMessage = z.discriminatedUnion('type', [
  HelloMessage,
  StateUpdateMessage,
  LogPushMessage,
  PongMessage,
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
  score: z.number().int(),
  timestamp: z.number().int().nonnegative(),
})
export type RestoreMessage = z.infer<typeof RestoreMessage>

export const ServerCommandMessage = z.object({
  type: z.literal('cmd'),
  cmd: z.enum(['ping', 'reset', 'sync', 'shutdown']),
})
export type ServerCommandMessage = z.infer<typeof ServerCommandMessage>

export const ServerToAppMessage = z.discriminatedUnion('type', [
  WelcomeMessage,
  RestoreMessage,
  ServerCommandMessage,
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
