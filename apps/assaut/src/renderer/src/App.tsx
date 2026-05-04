import { useCallback, useEffect, useMemo, useState } from 'react'
import type { KioskStatusResponse } from '@shared/ipc'
import { useGameState } from './persistence'
import { useServerHandshake } from './sync'

// Placeholder screen for chantier 04 / 05. Final maquettes will replace
// the entire surface; the kiosk-status footer is debugging UI for the
// 4-May validation visio and is scheduled for deletion afterward (see
// CONTEXT.md and the chantier 04 PR description). The diagnostic dot
// (NUC connected/disconnected) outlives the footer — it moves into a
// dedicated overlay in chantier 06+.

declare global {
  interface Window {
    readonly assaut?: import('@shared/ipc').AssautBridge
  }
}

export default function App() {
  const { state, setState, getLatest, ready } = useGameState()
  const wsUrl = useMemo(() => `ws://${state.serverIp}:8080/ws`, [state.serverIp])
  const { connection } = useServerHandshake({ url: wsUrl, state, ready })
  const [kiosk, setKiosk] = useState<KioskStatusResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const bridge = window.assaut
    if (bridge === undefined) {
      setError('preload bridge missing')
      return
    }
    bridge
      .getKioskStatus()
      .then(setKiosk)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)))
  }, [])

  const onCodeChange = useCallback(
    (next: string) => {
      // Persist on every keystroke. Read latest via getLatest() rather
      // than closing over `state` so two keystrokes between renders
      // can't merge from the same stale base. electron-store is sync
      // on-disk so a force-kill immediately after the keypress
      // preserves the buffer. Bounded to 64 chars by the GameState schema.
      const current = getLatest()
      void setState({ ...current, draftAuthCode: next.slice(0, 64), lastSync: Date.now() })
    },
    [setState, getLatest],
  )

  // Hold first paint until we know the persisted value — avoids a flash
  // of the empty placeholder and then a swap to the persisted code.
  if (!ready) {
    return <main className="screen" />
  }

  const dotGlyph =
    connection === 'connected' ? '●' : connection === 'connecting' ? '◐' : '○'
  const dotLabel =
    connection === 'connected'
      ? 'NUC connecté'
      : connection === 'connecting'
        ? 'NUC connexion…'
        : 'NUC hors-ligne'

  return (
    <main className="screen">
      <header className="screen__header">
        <span className="screen__brand">SECTION 13</span>
        <span className="screen__sub">authentification opérationnelle</span>
      </header>

      <section className="prompt">
        <label className="prompt__label" htmlFor="auth-code">
          Saisie code autorisation
        </label>
        <input
          id="auth-code"
          className="prompt__input"
          type="text"
          autoComplete="off"
          spellCheck={false}
          placeholder="——————"
          value={state.draftAuthCode}
          onChange={(event) => onCodeChange(event.target.value)}
          maxLength={64}
        />
        <p className="prompt__hint">placeholder — chantier 05 persistance</p>
      </section>

      <footer className="kiosk-status" aria-live="polite">
        <span
          className={`kiosk-status__dot ${
            connection === 'connected' ? 'kiosk-status__dot--ok' : ''
          }`}
          aria-label={dotLabel}
          title={dotLabel}
        >
          {dotGlyph}
        </span>
        {error !== null && <span className="kiosk-status__err">⚠ {error}</span>}
        {kiosk !== null && (
          <>
            <span>kiosk: {String(kiosk.kiosk)}</span>
            <span>fullscreen: {String(kiosk.fullscreen)}</span>
            <span>shortcuts: {kiosk.globalShortcutsRegistered.length}</span>
            {kiosk.globalShortcutsFailed.length > 0 && (
              <span className="kiosk-status__warn">
                failed: {kiosk.globalShortcutsFailed.join(', ')}
              </span>
            )}
          </>
        )}
      </footer>
    </main>
  )
}
