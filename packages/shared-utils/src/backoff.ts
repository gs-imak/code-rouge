// Capped exponential backoff for WS reconnect loops.
//
// Why capped: in a 60-min escape-game session, an uncapped exponential
// could leave a tablet that disconnects at minute 5 effectively offline
// for the rest of the session (delays of 64 s → 128 s → 256 s …).
// 30 s is enough that we don't hammer the server during sustained
// outages, short enough that a brief reconnect is barely perceptible.

export interface BackoffOptions {
  readonly initialDelayMs?: number
  readonly maxDelayMs?: number
  readonly multiplier?: number
  /**
   * Random jitter (fraction of the computed delay), defaults to 0.2 so
   * twelve simultaneously-disconnected tablets don't all hammer the
   * server at the same instant when it comes back up.
   */
  readonly jitter?: number
}

const DEFAULTS = {
  initialDelayMs: 1000,
  maxDelayMs: 30_000,
  multiplier: 2,
  jitter: 0.2,
} as const satisfies Required<BackoffOptions>

/**
 * Returns the next delay (ms) for an exponential backoff, given the
 * current attempt number (0-based: attempt 0 is the FIRST retry, not the
 * initial connect).
 *
 * Pure function so it's trivially testable. Random jitter is sampled at
 * call time using `Math.random` — pass a custom RNG via the optional
 * second argument for deterministic tests.
 */
export function nextBackoffDelay(
  attempt: number,
  options: BackoffOptions = {},
  rng: () => number = Math.random,
): number {
  const opts = { ...DEFAULTS, ...options }
  const base = opts.initialDelayMs * Math.pow(opts.multiplier, attempt)
  const capped = Math.min(base, opts.maxDelayMs)
  const jitterAmount = capped * opts.jitter * (rng() * 2 - 1) // ±jitter fraction
  // Floor at 0 — negative delays can't happen with these inputs but the
  // jitter math could produce one with adversarial options.
  return Math.max(0, Math.round(capped + jitterAmount))
}
