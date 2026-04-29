import { describe, it, expect } from 'vitest'
import {
  parseAppToServerMessage,
  parseServerToAppMessage,
  parseMessage,
  MessageParseError,
  type HelloMessage,
  type StateUpdateMessage,
  type LogPushMessage,
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
