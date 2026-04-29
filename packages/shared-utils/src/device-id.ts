// Per-install device identifier. Used in WS Hello so the server can
// restore the right team's state across an app restart.
//
// LIMITS: this is a random UUID generated on first boot and persisted
// alongside the rest of GameState. It's stable across normal app
// restarts — but a `pm clear` (Android) or wiping electron-store wipes
// it too. For production-grade stability across full local resets, swap
// the implementation in chantier 06+ to read Android's
// `Settings.Secure.ANDROID_ID` (RN apps) and the Windows machine GUID
// (Electron) via a small native module.

/**
 * Returns a freshly-generated, RFC-4122-format UUID.
 *
 * Uses `crypto.randomUUID()` when the runtime exposes it (Node 24,
 * Electron renderer, RN 0.74+ via Web Crypto). Falls back to a
 * `Math.random()`-derived blob — collision-resistant enough for a
 * 12-tablet venue, not cryptographically strong, but good enough as the
 * fallback path is only hit on ancient runtimes.
 */
export function randomDeviceId(): string {
  const c = typeof globalThis.crypto !== 'undefined' ? globalThis.crypto : undefined
  if (c !== undefined && typeof c.randomUUID === 'function') {
    return c.randomUUID()
  }
  // Fallback: 16 random hex bytes formatted as a UUID-like string.
  const hex = (n: number): string => Math.floor(Math.random() * 0xffff).toString(16).padStart(n, '0')
  return `${hex(8)}-${hex(4)}-${hex(4)}-${hex(4)}-${hex(8)}${hex(4)}`
}
