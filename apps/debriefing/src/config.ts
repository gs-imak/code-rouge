// Default NUC server URL. Chantier 06's Setup admin screen will override
// this via persisted state — the hardcoded value is the fallback for the
// first-boot demo flow on a single machine where the NUC runs locally.

export const DEFAULT_SERVER_WS_URL =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ((globalThis as any).process?.env?.['CODE_ROUGE_SERVER_URL'] as string | undefined) ??
  'ws://127.0.0.1:8080/ws'
