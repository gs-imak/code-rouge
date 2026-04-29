import { describe, it, expect, vi, afterEach } from 'vitest'
import { randomDeviceId } from './device-id.js'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('randomDeviceId', () => {
  it('returns a non-empty string in vitest (Node has crypto.randomUUID)', () => {
    const id = randomDeviceId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  it('matches RFC-4122 v4 UUID shape', () => {
    expect(randomDeviceId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    )
  })

  it('produces distinct values across calls', () => {
    const ids = new Set(Array.from({ length: 32 }, () => randomDeviceId()))
    expect(ids.size).toBe(32)
  })

  it('throws loudly when crypto.randomUUID is unavailable (the chantier-05 P0 fix)', () => {
    // The Math.random fallback was removed in chantier 05 review fixes —
    // an unsupported runtime should fail visibly rather than silently
    // produce a predictable UUID.
    vi.stubGlobal('crypto', undefined)
    expect(() => randomDeviceId()).toThrow(/crypto\.randomUUID is not available/)
  })
})
