import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createWsClient } from './ws-client.js'

// Minimal WebSocket stub. Tracks instances so each test can assert
// the number of (re)connection attempts and drive open/close events
// from outside without dealing with a real socket.
//
// Why classes-with-statics: the createWsClient code reads `Ctor.OPEN`
// at send-time. A vi.fn() factory wouldn't expose that constant.

class StubSocket {
  static OPEN = 1
  static instances: StubSocket[] = []

  readyState = 0
  url: string
  onopen: ((ev: unknown) => void) | null = null
  onclose: ((ev: unknown) => void) | null = null
  onmessage: ((ev: { data?: unknown }) => void) | null = null
  onerror: ((ev: unknown) => void) | null = null
  send = vi.fn<(data: string) => void>()
  close = vi.fn<(code?: number, reason?: string) => void>()

  constructor(url: string) {
    this.url = url
    StubSocket.instances.push(this)
  }

  // Test helpers — callers fire these to drive the client's lifecycle.
  emitOpen(): void {
    this.readyState = 1
    this.onopen?.({})
  }
  emitClose(): void {
    this.readyState = 3
    this.onclose?.({})
  }
  emitMessage(data: unknown): void {
    this.onmessage?.({ data })
  }
}

const StubCtor = StubSocket as unknown as typeof WebSocket

beforeEach(() => {
  vi.useFakeTimers()
  StubSocket.instances = []
})

afterEach(() => {
  vi.useRealTimers()
})

describe('createWsClient — connect / state', () => {
  it('opens a socket immediately and transitions connecting → connected on open', () => {
    const stateChanges: string[] = []
    createWsClient({
      url: 'ws://nuc',
      WebSocketCtor: StubCtor,
      onStateChange: (s) => stateChanges.push(s),
    })
    expect(StubSocket.instances).toHaveLength(1)
    expect(stateChanges).toEqual(['connecting'])

    StubSocket.instances[0]!.emitOpen()
    expect(stateChanges).toEqual(['connecting', 'connected'])
  })

  it('fires onOpen so the consumer can send Hello', () => {
    const onOpen = vi.fn()
    createWsClient({ url: 'ws://nuc', WebSocketCtor: StubCtor, onOpen })
    expect(onOpen).not.toHaveBeenCalled()
    StubSocket.instances[0]!.emitOpen()
    expect(onOpen).toHaveBeenCalledTimes(1)
  })
})

describe('createWsClient — reconnect loop', () => {
  it('schedules a reconnect after the socket closes', async () => {
    createWsClient({
      url: 'ws://nuc',
      WebSocketCtor: StubCtor,
      backoff: { initialDelayMs: 100, jitter: 0 },
    })
    StubSocket.instances[0]!.emitOpen()
    StubSocket.instances[0]!.emitClose()
    expect(StubSocket.instances).toHaveLength(1) // no immediate reconnect

    await vi.advanceTimersByTimeAsync(150) // past the 100 ms backoff
    expect(StubSocket.instances).toHaveLength(2) // reconnect fired
  })

  it('resets the attempt counter to 0 on a successful open', async () => {
    createWsClient({
      url: 'ws://nuc',
      WebSocketCtor: StubCtor,
      backoff: { initialDelayMs: 100, jitter: 0, multiplier: 2 },
    })
    // First socket: open, then drop. Second connect should fire after 100 ms.
    StubSocket.instances[0]!.emitOpen()
    StubSocket.instances[0]!.emitClose()
    await vi.advanceTimersByTimeAsync(150)
    expect(StubSocket.instances).toHaveLength(2)

    // Second socket succeeds → attempt resets. Drop again, expect 100 ms
    // again rather than 200 ms (which it would be if the counter hadn't reset).
    StubSocket.instances[1]!.emitOpen()
    StubSocket.instances[1]!.emitClose()
    await vi.advanceTimersByTimeAsync(150)
    expect(StubSocket.instances).toHaveLength(3)
  })

  it('disconnect halts the reconnect loop and ignores subsequent close events', async () => {
    const client = createWsClient({
      url: 'ws://nuc',
      WebSocketCtor: StubCtor,
      backoff: { initialDelayMs: 100, jitter: 0 },
    })
    StubSocket.instances[0]!.emitOpen()
    client.disconnect()
    expect(StubSocket.instances[0]!.close).toHaveBeenCalledWith(1000, 'client disconnect')

    // Even if a close event arrives after disconnect, the reconnect loop
    // must not schedule another connect.
    StubSocket.instances[0]!.emitClose()
    await vi.advanceTimersByTimeAsync(500)
    expect(StubSocket.instances).toHaveLength(1)
  })
})

describe('createWsClient — message validation', () => {
  it('parses a valid welcome and forwards it to onMessage', () => {
    const onMessage = vi.fn()
    createWsClient({ url: 'ws://nuc', WebSocketCtor: StubCtor, onMessage })
    StubSocket.instances[0]!.emitOpen()

    const welcome = {
      type: 'welcome',
      teamId: 7,
      sessionId: 'session-1',
      serverTime: 1714400000000,
    }
    StubSocket.instances[0]!.emitMessage(JSON.stringify(welcome))

    expect(onMessage).toHaveBeenCalledTimes(1)
    expect(onMessage).toHaveBeenCalledWith(welcome)
  })

  it('drops a malformed frame to onError, never to onMessage', () => {
    const onMessage = vi.fn()
    const onError = vi.fn()
    createWsClient({
      url: 'ws://nuc',
      WebSocketCtor: StubCtor,
      onMessage,
      onError,
    })
    StubSocket.instances[0]!.emitOpen()

    StubSocket.instances[0]!.emitMessage('not json at all')
    expect(onMessage).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledTimes(1)
  })

  it('ignores a binary frame without crashing', () => {
    const onMessage = vi.fn()
    const onError = vi.fn()
    createWsClient({
      url: 'ws://nuc',
      WebSocketCtor: StubCtor,
      onMessage,
      onError,
    })
    StubSocket.instances[0]!.emitOpen()
    // Non-string data → bailed early, neither callback fires.
    StubSocket.instances[0]!.emitMessage(new Uint8Array([1, 2, 3]))
    expect(onMessage).not.toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()
  })
})

describe('createWsClient — send', () => {
  it('serialises and sends when the socket is OPEN', () => {
    const client = createWsClient({ url: 'ws://nuc', WebSocketCtor: StubCtor })
    StubSocket.instances[0]!.emitOpen()
    const ok = client.send({
      type: 'hello',
      app: 'attaque-de-bots',
      deviceId: 'tablet-7',
      teamId: 7,
    })
    expect(ok).toBe(true)
    expect(StubSocket.instances[0]!.send).toHaveBeenCalledTimes(1)
    const payload = StubSocket.instances[0]!.send.mock.calls[0]![0]!
    expect(JSON.parse(payload)).toMatchObject({ type: 'hello', deviceId: 'tablet-7' })
  })

  it('returns false (and does not throw) when the socket is not OPEN', () => {
    const client = createWsClient({ url: 'ws://nuc', WebSocketCtor: StubCtor })
    // No emitOpen() yet — readyState is 0 (CONNECTING).
    const ok = client.send({
      type: 'hello',
      app: 'attaque-de-bots',
      deviceId: 'tablet-7',
      teamId: null,
    })
    expect(ok).toBe(false)
    expect(StubSocket.instances[0]!.send).not.toHaveBeenCalled()
  })
})
