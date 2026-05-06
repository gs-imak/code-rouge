import { useCallback, useMemo } from 'react'
import { useGameState } from './persistence'
import { useServerHandshake } from './sync'

// Placeholder screen for chantier 04 / 05. Final maquettes will replace
// the entire surface. The footer is intentionally tiny: just a NUC
// connection dot. The previous kiosk-status footer (kiosk: / fullscreen:
// / shortcuts: counts surfaced via IPC) was deleted post-validation
// because it doubled as a fingerprint surface for the renderer with no
// runtime payoff. Boot-time visibility into globalShortcut.register
// failures is now a console.warn in main (see registerKioskShortcuts).

declare global {
  interface Window {
    readonly assaut?: import('@shared/ipc').AssautBridge
  }
}

export default function App() {
  const { state, setState, getLatest, ready } = useGameState()
  const wsUrl = useMemo(() => `ws://${state.serverIp}:8080/ws`, [state.serverIp])
  const { connection } = useServerHandshake({ url: wsUrl, state, ready })

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

  // Hold first paint until we know the persisted value. Avoids a flash
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

      <footer className="nuc-status" aria-live="polite">
        <span
          className={`nuc-status__dot ${
            connection === 'connected' ? 'nuc-status__dot--ok' : ''
          }`}
          aria-label={dotLabel}
          title={dotLabel}
        >
          {dotGlyph}
        </span>
      </footer>
    </main>
  )
}
