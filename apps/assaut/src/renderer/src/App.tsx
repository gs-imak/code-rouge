import { useCallback, useEffect, useState } from 'react'
import type { KioskStatusResponse } from '@shared/ipc'
import { useGameState } from './persistence'

// Placeholder screen for chantier 04 / 05. Final maquettes will replace
// the entire surface; the kiosk-status footer is debugging UI for the
// 4-May validation visio and is scheduled for deletion afterward (see
// CONTEXT.md and the chantier 04 PR description).

declare global {
  interface Window {
    readonly assaut?: import('@shared/ipc').AssautBridge
  }
}

export default function App() {
  const { state, setState, ready } = useGameState()
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
      // Persist on every keystroke. electron-store is sync on-disk so
      // a force-kill immediately after the keypress preserves the buffer.
      // Bounded to 64 chars by the GameState schema.
      void setState({ ...state, draftAuthCode: next.slice(0, 64), lastSync: Date.now() })
    },
    [setState, state],
  )

  // Hold first paint until we know the persisted value — avoids a flash
  // of the empty placeholder and then a swap to the persisted code.
  if (!ready) {
    return <main className="screen" />
  }

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
