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
 * Returns a freshly-generated, RFC-4122 v4 UUID via the platform's
 * Web Crypto API.
 *
 * Throws when `crypto.randomUUID` is unavailable. All target runtimes
 * (Node 22+, Electron renderer, RN ≥ 0.74) ship it; an unsupported
 * runtime should fail loudly rather than fall back to a Math.random-
 * derived UUID, which is predictable enough that an on-LAN attacker who
 * sniffs one Hello frame can statistically narrow another tablet's
 * deviceId space.
 */
export function randomDeviceId(): string {
  const c = typeof globalThis.crypto !== 'undefined' ? globalThis.crypto : undefined
  if (c === undefined || typeof c.randomUUID !== 'function') {
    throw new Error(
      'crypto.randomUUID is not available in this runtime. ' +
        'Expected Node 22+, Electron renderer, or React Native ≥ 0.74.',
    )
  }
  return c.randomUUID()
}
