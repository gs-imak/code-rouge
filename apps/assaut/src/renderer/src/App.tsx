import { useEffect, useState } from 'react'
import type { KioskStatusResponse } from '@shared/ipc'

// Placeholder screen for chantier 04 — the maquettes for the « Section 13 »
// hacker-terminal aesthetic land later. For now we show the screen the AC
// expects ("Saisie code autorisation — placeholder") plus a kiosk-status
// readout so a tester can verify the triple-verrou is engaged at a glance.

declare global {
  interface Window {
    readonly assaut?: import('@shared/ipc').AssautBridge
  }
}

export default function App() {
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
          aria-label="Code d'autorisation"
        />
        <p className="prompt__hint">placeholder — chantier 04 scaffold</p>
      </section>

      <footer className="kiosk-status" aria-live="polite">
        {error !== null && <span className="kiosk-status__err">⚠ {error}</span>}
        {kiosk !== null && (
          <>
            <span>kiosk: {String(kiosk.kiosk)}</span>
            <span>fullscreen: {String(kiosk.fullscreen)}</span>
            <span>shortcuts: {kiosk.globalShortcutsRegistered.length}</span>
          </>
        )}
      </footer>
    </main>
  )
}
