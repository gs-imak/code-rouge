// Default NUC server URL. Chantier 06's Setup admin screen will override
// this via persisted state — the hardcoded value is the fallback for the
// first-boot demo flow on a single machine where the NUC runs locally.

export const DEFAULT_SERVER_WS_URL =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ((globalThis as any).process?.env?.['CODE_ROUGE_SERVER_URL'] as string | undefined) ??
  'ws://127.0.0.1:8080/ws'

// GM unlock code gating the Débriefing console (defense-in-depth: a player who
// reaches the device can't read other teams' stats / the suspect list). The
// gate is session-ephemeral — the GM re-enters it after a cold boot.
//
// PLACEHOLDER value — Nathanaël sets the real code before deployment, here or
// via the `CODE_ROUGE_GM_CODE` env override (M2 decision: static GM PIN in
// local config). This is NOT the kiosk device-owner unlock nor the per-session
// NUC reset code; it is a separate app-level gate.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rawGmCode = ((globalThis as any).process?.env?.['CODE_ROUGE_GM_CODE'] as string | undefined)?.trim()
// Non-empty guard: an empty/whitespace env override must NOT collapse the gate
// to "any blank input unlocks" (a misconfiguration auth-bypass). Fall back to
// the placeholder instead.
export const GM_UNLOCK_CODE = rawGmCode !== undefined && rawGmCode.length > 0 ? rawGmCode : '1313'
