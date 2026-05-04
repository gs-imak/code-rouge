import { describe, it, expect } from 'vitest'
import {
  parseAppToServerMessage,
  parseServerToAppMessage,
  parseMessage,
  MessageParseError,
  GameState,
  DEFAULT_GAME_STATE,
  reconcile,
  type HelloMessage,
  type StateUpdateMessage,
  type LogPushMessage,
  type RestoreMessage,
} from './messages.js'

describe('parseAppToServerMessage — round-trip', () => {
  it('parses a valid hello with teamId=null', () => {
    const hello: HelloMessage = {
      type: 'hello',
      app: 'attaque-de-bots',
      deviceId: 'tablet-7-mac-aabbcc',
      teamId: null,
    }
    expect(parseAppToServerMessage(JSON.stringify(hello))).toEqual(hello)
  })

  it('parses a valid hello with teamId set + lastKnownStep', () => {
    const hello: HelloMessage = {
      type: 'hello',
      app: 'assaut',
      deviceId: 'pc-mallette-1',
      teamId: 7,
      lastKnownStep: 'mcgyver',
    }
    expect(parseAppToServerMessage(JSON.stringify(hello))).toEqual(hello)
  })

  it('parses a valid state update', () => {
    const state: StateUpdateMessage = {
      type: 'state',
      app: 'attaque-de-bots',
      deviceId: 'tablet-7-mac-aabbcc',
      teamId: 7,
      step: 'phishing',
      score: 12,
      timestamp: 1714400000000,
    }
    expect(parseAppToServerMessage(JSON.stringify(state))).toEqual(state)
  })

  it('parses a log push with multiple events', () => {
    const log: LogPushMessage = {
      type: 'log',
      app: 'debriefing',
      deviceId: 'phone-gm-1',
      teamId: 3,
      events: [
        { at: 1714400000000, kind: 'phishing-clicked', data: { mailId: 'm-7' } },
        { at: 1714400005000, kind: 'step-complete' },
      ],
    }
    expect(parseAppToServerMessage(JSON.stringify(log))).toEqual(log)
  })

  it('throws MessageParseError on malformed JSON', () => {
    expect(() => parseAppToServerMessage('{not json')).toThrowError(MessageParseError)
    try {
      parseAppToServerMessage('{not json')
    } catch (err) {
      expect(err).toBeInstanceOf(MessageParseError)
      if (err instanceof MessageParseError) {
        expect(err.message).toContain('invalid JSON')
      }
    }
  })

  it('throws MessageParseError on unknown type', () => {
    const bogus = JSON.stringify({ type: 'bogus', whatever: 1 })
    expect(() => parseAppToServerMessage(bogus)).toThrowError(MessageParseError)
  })

  it('rejects a hello with an unknown app name', () => {
    const bogus = JSON.stringify({
      type: 'hello',
      app: 'rogue-app',
      deviceId: 'd1',
      teamId: null,
    })
    expect(() => parseAppToServerMessage(bogus)).toThrowError(MessageParseError)
  })

  it('rejects a state with negative timestamp', () => {
    const bogus = JSON.stringify({
      type: 'state',
      app: 'assaut',
      deviceId: 'd1',
      teamId: 1,
      step: 's',
      score: 0,
      timestamp: -1,
    })
    expect(() => parseAppToServerMessage(bogus)).toThrowError(MessageParseError)
  })

  it('rejects a log push with empty events array', () => {
    const bogus = JSON.stringify({
      type: 'log',
      app: 'assaut',
      deviceId: 'd1',
      teamId: 1,
      events: [],
    })
    expect(() => parseAppToServerMessage(bogus)).toThrowError(MessageParseError)
  })

  it('rejects a deviceId longer than 64 chars (DoS guard)', () => {
    const bogus = JSON.stringify({
      type: 'hello',
      app: 'assaut',
      deviceId: 'x'.repeat(65),
      teamId: null,
    })
    expect(() => parseAppToServerMessage(bogus)).toThrowError(MessageParseError)
  })
})

describe('parseServerToAppMessage', () => {
  it('parses a welcome', () => {
    const welcome = {
      type: 'welcome' as const,
      teamId: 7,
      sessionId: 'sess-2026-04-29-001',
      serverTime: 1714400000000,
    }
    expect(parseServerToAppMessage(JSON.stringify(welcome))).toEqual(welcome)
  })

  it('parses a restore', () => {
    const restore = {
      type: 'restore' as const,
      teamId: 7,
      app: 'attaque-de-bots' as const,
      step: 'phishing',
      score: 12,
      timestamp: 1714400000000,
    }
    expect(parseServerToAppMessage(JSON.stringify(restore))).toEqual(restore)
  })

  it('parses a server command', () => {
    const cmd = { type: 'cmd' as const, cmd: 'reset' as const }
    expect(parseServerToAppMessage(JSON.stringify(cmd))).toEqual(cmd)
  })

  it('rejects a cmd with an unknown verb', () => {
    const bogus = JSON.stringify({ type: 'cmd', cmd: 'self-destruct' })
    expect(() => parseServerToAppMessage(bogus)).toThrowError(MessageParseError)
  })
})

describe('parseMessage alias', () => {
  it('is the App → Server parser', () => {
    expect(parseMessage).toBe(parseAppToServerMessage)
  })
})

describe('GameState defaults', () => {
  it('parses {} into the canonical default record', () => {
    expect(GameState.parse({})).toEqual({
      deviceId: '',
      teamId: null,
      currentStep: 'init',
      score: 0,
      lastSync: 0,
      draftAuthCode: '',
      serverIp: '127.0.0.1',
    })
  })

  it('DEFAULT_GAME_STATE matches GameState.parse({})', () => {
    // Guards against the constant being edited out of sync with Zod.
    expect(DEFAULT_GAME_STATE).toEqual(GameState.parse({}))
  })

  it('rejects an empty currentStep (min(1) on the schema)', () => {
    expect(() => GameState.parse({ currentStep: '' })).toThrow()
  })
})

describe('reconcile', () => {
  const restore: RestoreMessage = {
    type: 'restore',
    teamId: 7,
    app: 'attaque-de-bots',
    step: 'phishing',
    score: 42,
    timestamp: 1714400000000,
  }

  it('server step+score win when local is at init', () => {
    const local = GameState.parse({})
    const merged = reconcile(local, restore)
    expect(merged.currentStep).toBe('phishing')
    expect(merged.score).toBe(42)
  })

  it('app step wins when local has progressed past init', () => {
    const local = GameState.parse({ currentStep: 'mailbox', score: 10 })
    const merged = reconcile(local, restore)
    expect(merged.currentStep).toBe('mailbox')
  })

  it('score takes Math.max when local has progressed', () => {
    // Local lower than restore → restore.score wins (no regression on
    // unflushed StateUpdate before a force-stop).
    expect(
      reconcile(GameState.parse({ currentStep: 'mailbox', score: 10 }), restore).score,
    ).toBe(42)
    // Local higher than restore → local.score wins.
    expect(
      reconcile(GameState.parse({ currentStep: 'mailbox', score: 99 }), restore).score,
    ).toBe(99)
  })

  it('server teamId always wins regardless of local progress', () => {
    const local = GameState.parse({ teamId: 3, currentStep: 'mailbox', score: 10 })
    expect(reconcile(local, restore).teamId).toBe(7)
  })

  it('preserves draftAuthCode in both branches', () => {
    const draft = 'abc123'
    expect(
      reconcile(GameState.parse({ draftAuthCode: draft }), restore).draftAuthCode,
    ).toBe(draft)
    expect(
      reconcile(GameState.parse({ currentStep: 'mailbox', draftAuthCode: draft }), restore)
        .draftAuthCode,
    ).toBe(draft)
  })

  it('sets lastSync to a fresh timestamp (not 0, not restore.timestamp)', () => {
    const before = Date.now()
    const merged = reconcile(GameState.parse({}), restore)
    expect(merged.lastSync).toBeGreaterThanOrEqual(before)
    expect(merged.lastSync).not.toBe(0)
    expect(merged.lastSync).not.toBe(restore.timestamp)
  })

  it('preserves local deviceId (server never carries one in RestoreMessage)', () => {
    const local = GameState.parse({ deviceId: 'pinned-uuid-1234' })
    expect(reconcile(local, restore).deviceId).toBe('pinned-uuid-1234')
  })

  it('preserves local serverIp (NUC IP is GM-configured, server has no authority)', () => {
    const local = GameState.parse({ serverIp: '192.168.42.10' })
    expect(reconcile(local, restore).serverIp).toBe('192.168.42.10')
  })
})
