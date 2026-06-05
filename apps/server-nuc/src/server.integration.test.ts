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

describe('server integration — /diag endpoint', () => {
  it('returns the expected schema with zero connected clients', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/diag`)
    expect(res.status).toBe(200)
    const body = (await res.json()) as Record<string, unknown>
    expect(body).toMatchObject({
      schemaVersion: 1,
      sessionId: booted.sessionId,
      connectedClients: { total: expect.any(Number), perApp: expect.any(Object) },
    })
    expect(typeof body['uptimeSeconds']).toBe('number')
  })

  it('reports connected clients grouped by app after Hello', async () => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`)
    await once(ws, 'open')
    send(ws, {
      type: 'hello',
      app: 'attaque-de-bots',
      deviceId: 'diag-tablet',
      teamId: null,
    })
    // Give the server a tick to process Hello and tag the connection.
    await new Promise((r) => setTimeout(r, 100))

    const res = await fetch(`http://127.0.0.1:${port}/diag`)
    const body = (await res.json()) as {
      connectedClients: { total: number; perApp: Record<string, number> }
    }
    expect(body.connectedClients.total).toBeGreaterThanOrEqual(1)
    expect(body.connectedClients.perApp['attaque-de-bots']).toBeGreaterThanOrEqual(1)

    ws.close(1000)
    await once(ws, 'close')
  }, 5_000)
})

describe('server integration — POST /admin/reset', () => {
  // Fresh session per request — the booted server's resetCode is captured
  // once at startServer time. We don't expose it on BootedServer (yet) so
  // these tests reach into the closure via a synthetic match: the route
  // returns 401 on bad code, 400 on bad shape, and 200 on the right code.

  it('returns 400 when the body is malformed', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/admin/reset`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ wrong: 'field' }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 401 on a wrong code', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/admin/reset`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: 'definitely-not-the-right-code' }),
    })
    expect(res.status).toBe(401)
  })

  it('returns 401 on the right code from the WRONG length (constant-time guard)', async () => {
    // Even shape-correct submissions of the wrong length must 401 cleanly,
    // not throw or reveal the expected length.
    const res = await fetch(`http://127.0.0.1:${port}/admin/reset`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: 'a' }),
    })
    expect(res.status).toBe(401)
  })

  it('returns 429 after exceeding the per-IP brute-force threshold', async () => {
    // The threshold is 5 wrong attempts within 60 s. Prior tests in
    // this describe already accrued some — fire enough more to be
    // certain we cross it. The N+1th request after the lockout fires
    // returns 429 regardless of body shape.
    for (let i = 0; i < 6; i += 1) {
      await fetch(`http://127.0.0.1:${port}/admin/reset`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: `still-wrong-${i}` }),
      })
    }
    const res = await fetch(`http://127.0.0.1:${port}/admin/reset`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: 'still-wrong' }),
    })
    expect(res.status).toBe(429)
  })
})

describe('server integration — GM access-point + MG-code relay', () => {
  // Share three connections across these tests — the per-IP WS connection rate
  // limit (10 / 10 s) would otherwise be exhausted by the cumulative opens in
  // this file. teamA (9) is the relay target, teamB (22) the non-target, gm the
  // Débriefing sender.
  let teamA: WS
  let teamB: WS
  let gm: WS

  async function hello(ws: WS, app: string, deviceId: string, teamId: number | null): Promise<void> {
    const welcomed = recordFrames(ws, (m) => m.type === 'welcome')
    send(ws, { type: 'hello', app, deviceId, teamId })
    await welcomed
  }

  beforeAll(async () => {
    teamA = new WebSocket(`ws://127.0.0.1:${port}/ws`)
    teamB = new WebSocket(`ws://127.0.0.1:${port}/ws`)
    gm = new WebSocket(`ws://127.0.0.1:${port}/ws`)
    await Promise.all([once(teamA, 'open'), once(teamB, 'open'), once(gm, 'open')])
    await hello(teamA, 'assaut', 'relay-assaut-9', 9)
    await hello(teamB, 'assaut', 'relay-assaut-22', 22)
    await hello(gm, 'debriefing', 'relay-gm', null)
  }, 10_000)

  afterAll(async () => {
    for (const ws of [teamA, teamB, gm]) ws.close(1000)
  })

  it('relays an access-decision to the target team as access-result', async () => {
    const got = recordFrames(teamA, (m) => m.type === 'access-result')
    send(gm, {
      type: 'access-decision',
      app: 'debriefing',
      deviceId: 'relay-gm',
      targetTeamId: 9,
      decision: 'approved',
      label: 'Toits',
    })
    const frames = await got
    expect(frames.find((m) => m.type === 'access-result')).toMatchObject({
      type: 'access-result',
      decision: 'approved',
      label: 'Toits',
    })
  })

  it('relays an mg-code-set to the target team as mg-code', async () => {
    const got = recordFrames(teamA, (m) => m.type === 'mg-code')
    send(gm, {
      type: 'mg-code-set',
      app: 'debriefing',
      deviceId: 'relay-gm',
      targetTeamId: 9,
      code: '4242',
    })
    const frames = await got
    expect(frames.find((m) => m.type === 'mg-code')).toMatchObject({
      type: 'mg-code',
      code: '4242',
    })
  })

  it('does not deliver an access-result to a non-target team', async () => {
    let otherSaw = false
    const onOther = (raw: Buffer): void => {
      if ((JSON.parse(raw.toString()) as Frame).type === 'access-result') otherSaw = true
    }
    teamB.on('message', onOther)
    const got = recordFrames(teamA, (m) => m.type === 'access-result')
    send(gm, {
      type: 'access-decision',
      app: 'debriefing',
      deviceId: 'relay-gm',
      targetTeamId: 9,
      decision: 'refused',
    })
    await got
    await new Promise((r) => setTimeout(r, 150))
    teamB.off('message', onOther)
    expect(otherSaw).toBe(false)
  })
})

describe('server integration — débriefing aggregation', () => {
  // A bots team pushes its state + end-of-session log; the GM (Débriefing) then
  // discovers teams and pulls the log from the server. Two connections only to
  // stay under the per-IP WS connection rate limit shared across this file.
  let bots: WS
  let gm: WS

  async function hello(ws: WS, app: string, deviceId: string, teamId: number | null): Promise<void> {
    const welcomed = recordFrames(ws, (m) => m.type === 'welcome')
    send(ws, { type: 'hello', app, deviceId, teamId })
    await welcomed
  }

  beforeAll(async () => {
    bots = new WebSocket(`ws://127.0.0.1:${port}/ws`)
    gm = new WebSocket(`ws://127.0.0.1:${port}/ws`)
    await Promise.all([once(bots, 'open'), once(gm, 'open')])
    await hello(bots, 'attaque-de-bots', 'agg-bots-5', 5)
    await hello(gm, 'debriefing', 'agg-gm', null)
    send(bots, {
      type: 'state',
      app: 'attaque-de-bots',
      deviceId: 'agg-bots-5',
      teamId: 5,
      step: 'fin',
      score: 350,
      timestamp: Date.now(),
    })
    send(bots, {
      type: 'log',
      app: 'attaque-de-bots',
      deviceId: 'agg-bots-5',
      teamId: 5,
      events: [
        { at: 1, kind: 'enigme-solved', data: { step: 'a-mdp', attempts: 1 } },
        { at: 2, kind: 'phishing-clicked', data: { mail: 'phishing-update-creds' } },
        { at: 3, kind: 'session-complete', data: { score: 350 } },
      ],
    })
    // Let the upsert + log batch commit before the GM queries.
    await new Promise((r) => setTimeout(r, 80))
  }, 10_000)

  afterAll(async () => {
    for (const ws of [bots, gm]) ws.close(1000)
  })

  it('serves the session teams to the GM', async () => {
    const got = recordFrames(gm, (m) => m.type === 'teams')
    send(gm, { type: 'teams-request', app: 'debriefing', deviceId: 'agg-gm' })
    const frames = await got
    const teams = frames.find((m) => m.type === 'teams') as unknown as {
      readonly teams: ReadonlyArray<{ teamId: number; apps: string[] }>
    }
    expect(teams.teams.some((t) => t.teamId === 5 && t.apps.includes('attaque-de-bots'))).toBe(true)
  })

  it('serves a team event log to the GM in order', async () => {
    const got = recordFrames(gm, (m) => m.type === 'log-result')
    send(gm, { type: 'log-request', app: 'debriefing', deviceId: 'agg-gm', targetTeamId: 5 })
    const frames = await got
    const result = frames.find((m) => m.type === 'log-result') as unknown as {
      readonly teamId: number
      readonly events: ReadonlyArray<{ kind: string }>
    }
    expect(result.teamId).toBe(5)
    expect(result.events.map((e) => e.kind)).toEqual([
      'enigme-solved',
      'phishing-clicked',
      'session-complete',
    ])
  })

  it('denies a teams-request from a non-débriefing app', async () => {
    let saw = false
    const onMsg = (raw: Buffer): void => {
      if ((JSON.parse(raw.toString()) as Frame).type === 'teams') saw = true
    }
    bots.on('message', onMsg)
    send(bots, { type: 'teams-request', app: 'attaque-de-bots', deviceId: 'agg-bots-5' })
    await new Promise((r) => setTimeout(r, 250))
    bots.off('message', onMsg)
    expect(saw).toBe(false)
  })
})
