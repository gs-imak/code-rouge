#!/usr/bin/env node
// Standalone Node script that simulates a tablet's persistence + restore
// flow against the running NUC server. Used by demo-persistence.sh.
//
// Flow:
//   Phase 1 — connect, hello (teamId=7), state (step=phishing, score=12), disconnect
//   Phase 2 — reconnect with same deviceId, teamId=null (simulating an
//             app-process restart on a tablet whose AsyncStorage retained
//             the deviceId — i.e. the chantier 05.1 force-stop AC, NOT
//             a full storage wipe). Expects a `restore` message
//             carrying team 7 / step phishing / score 12.
//
//   IMPORTANT: this verifies the FORCE-STOP path, not the storage-wipe
//   path. A real `pm clear` on the tablet wipes the persisted deviceId,
//   the tablet generates a fresh UUID on next boot, and the server-side
//   restore-by-deviceId can't match. Hardware-derived device IDs land in
//   chantier 06+; until then, "Reset local storage" in the demo means
//   force-stop + relaunch.
//
// Exit code:
//   0 — restore round-trip OK
//   1 — connection or protocol error
//   2 — restore not received within timeout

import WebSocket from 'ws'

const URL = process.env.SERVER_WS_URL ?? 'ws://127.0.0.1:8080/ws'
const DEVICE = process.env.DEMO_DEVICE_ID ?? 'demo-tablet-7'
const TEAM_ID = Number.parseInt(process.env.DEMO_TEAM_ID ?? '7', 10)
const STEP = process.env.DEMO_STEP ?? 'phishing'
const SCORE = Number.parseInt(process.env.DEMO_SCORE ?? '12', 10)

const TIMEOUT_MS = 5000

function phase(label, run) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(URL)
    const timer = setTimeout(() => {
      ws.close()
      reject(new Error(`${label} timeout after ${TIMEOUT_MS}ms`))
    }, TIMEOUT_MS)
    ws.on('open', () => run({ ws, resolve, reject, timer }))
    ws.on('error', (err) => {
      clearTimeout(timer)
      reject(err)
    })
  })
}

async function phase1() {
  console.log('[phase1] connect, hello, state(step=%s, score=%d)', STEP, SCORE)
  await phase('phase1', ({ ws, resolve, timer }) => {
    ws.send(
      JSON.stringify({
        type: 'hello',
        app: 'attaque-de-bots',
        deviceId: DEVICE,
        teamId: TEAM_ID,
      }),
    )
    ws.send(
      JSON.stringify({
        type: 'state',
        app: 'attaque-de-bots',
        deviceId: DEVICE,
        teamId: TEAM_ID,
        step: STEP,
        score: SCORE,
        timestamp: Date.now(),
      }),
    )
    setTimeout(() => {
      clearTimeout(timer)
      ws.close(1000, 'phase1 done')
      resolve()
    }, 300)
  })
}

async function phase2() {
  console.log('[phase2] reconnect post-force-stop (deviceId stable), expect restore')
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(URL)
    const timer = setTimeout(() => {
      ws.close()
      reject(new Error('phase2: restore not received within timeout'))
    }, TIMEOUT_MS)

    ws.on('open', () => {
      ws.send(
        JSON.stringify({
          type: 'hello',
          app: 'attaque-de-bots',
          deviceId: DEVICE,
          teamId: null,
        }),
      )
    })
    ws.on('message', (raw) => {
      const msg = JSON.parse(raw.toString())
      console.log('[phase2] rx', msg.type, '→', JSON.stringify(msg))
      if (msg.type === 'restore') {
        if (msg.teamId !== TEAM_ID || msg.step !== STEP || msg.score !== SCORE) {
          clearTimeout(timer)
          ws.close()
          reject(
            new Error(
              `restore payload mismatch: got teamId=${msg.teamId} step=${msg.step} score=${msg.score}`,
            ),
          )
          return
        }
        clearTimeout(timer)
        ws.close(1000, 'phase2 done')
        resolve()
      }
    })
    ws.on('error', (err) => {
      clearTimeout(timer)
      reject(err)
    })
  })
}

try {
  await phase1()
  await new Promise((r) => setTimeout(r, 300))
  await phase2()
  console.log('OK — server-side restore round-trip verified')
  process.exit(0)
} catch (err) {
  console.error('FAIL —', err.message)
  process.exit(err.message?.includes('timeout') ? 2 : 1)
}
