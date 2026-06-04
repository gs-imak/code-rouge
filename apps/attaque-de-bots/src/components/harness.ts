// DEV web-harness flag. `?bg=none` strips every opaque background (placeholder,
// canvas, page) so a screenshot captures the FOREGROUND only on a transparent
// canvas — the foreground-diff tool (_figfg.mjs) then composites it over the Figma
// render's own background so the placeholder-vs-photo difference cancels and only
// foreground alignment is measured.
//
// Always false in the native app (no `location`) → the placeholder always renders.
// Parsed by regex (not URLSearchParams) so this stays type-safe in shared modules
// that don't pull in the DOM lib.
export function isBgNoneHarness(): boolean {
  const search = (globalThis as { location?: { search?: string } }).location?.search ?? ''
  return /[?&]bg=none(?:&|$)/.test(search)
}
