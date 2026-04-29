import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { once } from 'node:events'
import { WebSocket, type WebSocket as WS } from 'ws'
import { startServer } from './index.js'
import type { ServerConfig } from './config.js'

// End-to-end test: boot the actual server in-process on a kernel-assigned
// port, then run the chantier-05.3 force-stop restore round-trip via a
// real WebSocket client. Mirrors what `tools/scripts/demo-persistence.sh`
// runs from a shell, but lives in CI so a protocol regression breaks the
// build instead of waiting for the demo to fail.

let tempDir: string
let booted: ReturnType<typeof startServer>
let port: number

beforeAll(async () => {
  tempDir = mkdtempSync(join(tmpdir(), 'cr-server-int-'))
  const config: ServerConfig = {
    host: '127.0.0.1',
    port: 0, // kernel-assigned
    databasePath: join(tempDir, 'integration.sqlite'),
    logLevel: 'fatal',
    nodeEnv: 'test',
  }
  booted = startServer(config)
  await once(booted.http, 'listening')
  const addr = booted.http.address()
  if (addr === null || typeof addr === 'string') {
    throw new Error('expected a TCP address from http.listen, got something else')
  }
  port = addr.port
}, 10_000)

afterAll(async () => {
  // Manual teardown — the production `shutdown` calls process.exit, which
  // would kill the test process. We just close the layers in the same
  // order the production path would.
  for (const ws of booted.wss.clients) ws.close(1001, 'test shutdown')
  await new Promise<void>((resolve) => booted.wss.close(() => resolve()))
  await new Promise<void>((resolve) => booted.http.close(() => resolve()))
  booted.db.close()
  rmSync(tempDir, { recursive: true, force: true })
})

interface Frame {
  readonly type: string
  readonly [k: string]: unknown
}

function recordFrames(ws: WS, until: (msg: Frame) => boolean, timeoutMs = 2000): Promise<Frame[]> {
  const seen: Frame[] = []
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      ws.off('message', onMessage)
      reject(new Error(`timed out waiting for predicate; saw ${JSON.stringify(seen)}`))
    }, timeoutMs)
    const onMessage = (raw: Buffer): void => {
      const msg = JSON.parse(raw.toString()) as Frame
      seen.push(msg)
      if (until(msg)) {
        clearTimeout(timer)
        ws.off('message', onMessage)
        resolve(seen)
      }
    }
    ws.on('message', onMessage)
  })
}

function send(ws: WS, msg: object): void {
  ws.send(JSON.stringify(msg))
}

describe('server integration — force-stop restore round-trip', () => {
  it('emits welcome+restore on the second connect with the same deviceId', async () => {
    // Phase 1: connect, hello + state, then close.
    const ws1 = new WebSocket(`ws://127.0.0.1:${port}/ws`)
    await once(ws1, 'open')
    const phase1 = recordFrames(ws1, (m) => m.type === 'welcome')
    send(ws1, {
      type: 'hello',
      app: 'attaque-de-bots',
      deviceId: 'integration-tablet-7',
      teamId: 7,
    })
    await phase1
    send(ws1, {
      type: 'state',
      app: 'attaque-de-bots',
      deviceId: 'integration-tablet-7',
      teamId: 7,
      step: 'phishing',
      score: 12,
      timestamp: Date.now(),
    })
    // Give the server a tick to commit the upsert before we close.
    await new Promise((r) => setTimeout(r, 50))
    ws1.close(1000, 'phase 1 done')
    await once(ws1, 'close')

    // Phase 2: reconnect with same deviceId, teamId=null. Expect welcome
    // (with inferred teamId) AND a restore carrying step+score.
    const ws2 = new WebSocket(`ws://127.0.0.1:${port}/ws`)
    await once(ws2, 'open')
    const phase2 = recordFrames(ws2, (m) => m.type === 'restore')
    send(ws2, {
      type: 'hello',
      app: 'attaque-de-bots',
      deviceId: 'integration-tablet-7',
      teamId: null,
    })
    const frames = await phase2
    ws2.close(1000)
    await once(ws2, 'close')

    const welcome = frames.find((m) => m.type === 'welcome')
    const restore = frames.find((m) => m.type === 'restore')
    expect(welcome).toMatchObject({ teamId: 7 })
    expect(restore).toMatchObject({
      type: 'restore',
      teamId: 7,
      app: 'attaque-de-bots',
      step: 'phishing',
      score: 12,
    })
  }, 10_000)

  it('does NOT emit restore for an unknown deviceId', async () => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`)
    await once(ws, 'open')
    send(ws, {
      type: 'hello',
      app: 'attaque-de-bots',
      deviceId: 'never-seen-before',
      teamId: null,
    })

    // Wait briefly to see if a restore arrives. It shouldn't.
    const sawRestore = await new Promise<boolean>((resolve) => {
      const timer = setTimeout(() => resolve(false), 400)
      ws.on('message', (raw) => {
        const msg = JSON.parse(raw.toString()) as Frame
        if (msg.type === 'restore') {
          clearTimeout(timer)
          resolve(true)
        }
      })
    })
    ws.close(1000)
    await once(ws, 'close')
    expect(sawRestore).toBe(false)
  }, 5_000)
})
