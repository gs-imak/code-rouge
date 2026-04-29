import { describe, it, expect } from 'vitest'
import { nextBackoffDelay } from './backoff.js'

// Deterministic RNG for jitter tests — always returns the value at the
// midpoint of [0, 1] so the jitter contribution is zero.
const noJitterRng = () => 0.5

describe('nextBackoffDelay', () => {
  it('starts at the initial delay on attempt 0', () => {
    expect(nextBackoffDelay(0, {}, noJitterRng)).toBe(1000)
  })

  it('doubles each subsequent attempt', () => {
    expect(nextBackoffDelay(1, {}, noJitterRng)).toBe(2000)
    expect(nextBackoffDelay(2, {}, noJitterRng)).toBe(4000)
    expect(nextBackoffDelay(3, {}, noJitterRng)).toBe(8000)
    expect(nextBackoffDelay(4, {}, noJitterRng)).toBe(16_000)
  })

  it('caps at maxDelayMs (default 30 000)', () => {
    // Attempt 5 base would be 32 000 — capped at 30 000.
    expect(nextBackoffDelay(5, {}, noJitterRng)).toBe(30_000)
    // Attempt 100 still capped.
    expect(nextBackoffDelay(100, {}, noJitterRng)).toBe(30_000)
  })

  it('applies symmetric ±jitter via the supplied RNG', () => {
    // rng=1 → jitter coefficient = 1 (full plus); 1000 + 1000 * 0.2 = 1200
    expect(nextBackoffDelay(0, {}, () => 1)).toBe(1200)
    // rng=0 → jitter coefficient = -1 (full minus); 1000 - 200 = 800
    expect(nextBackoffDelay(0, {}, () => 0)).toBe(800)
  })

  it('never returns a negative delay even with a tiny initial + max jitter', () => {
    expect(nextBackoffDelay(0, { initialDelayMs: 10, jitter: 5 }, () => 0)).toBeGreaterThanOrEqual(
      0,
    )
  })

  it('respects custom maxDelayMs', () => {
    expect(nextBackoffDelay(10, { maxDelayMs: 5000 }, noJitterRng)).toBe(5000)
  })

  it('respects custom multiplier', () => {
    expect(nextBackoffDelay(2, { multiplier: 3 }, noJitterRng)).toBe(9000) // 1000 * 3^2
  })
})
