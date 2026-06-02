import type { ConnectionState } from '@code-rouge/shared-utils'
import emblemUrl from './assets/section13-emblem.svg'
import markUrl from './assets/section13-mark.svg'
import './ConnexionScreen.css'

// « Connexion » — the engine's `saisie-acces` prep step. Habillé from the M2
// maquette (Figma node 9:1382, .figma-ref/02-connexion.png), styled entirely
// from @code-rouge/design-system tokens via the injected `--cr-*` CSS vars.
//
// Purely presentational: the access code value + persistence live in App
// (GameState.draftAuthCode), engine navigation lives in useAssautSequence. That
// keeps this component renderable by the browser screenshot harness with no
// Electron `window.assaut` bridge. UI strings stay French (CLAUDE.md lang rule).

export interface ConnexionScreenProps {
  /** Current access code (owned + persisted by App). */
  readonly code: string
  readonly onCodeChange: (next: string) => void
  /** Validate the code — advances past `saisie-acces` once navigation is wired. */
  readonly onValidate: () => void
  /** NUC link state. Not drawn on this screen (the maquette has no indicator —
   *  the diagnostic moves to a dedicated overlay in a later chantier); surfaced
   *  as a `data-nuc` attribute for tests / a future overlay without regressing
   *  the M1 handshake. */
  readonly nucConnection?: ConnectionState
}

export function ConnexionScreen({
  code,
  onCodeChange,
  onValidate,
  nucConnection,
}: ConnexionScreenProps): JSX.Element {
  return (
    <main className="connexion" data-nuc={nucConnection}>
      <header className="connexion__bar">
        <div className="connexion__brand">
          <img className="connexion__brand-mark" src={markUrl} alt="" aria-hidden="true" />
          <span className="connexion__brand-name">SECTION 13</span>
        </div>
        <h1 className="connexion__title">Préparation de l’assaut</h1>
      </header>

      <div className="connexion__stage">
        <div className="connexion__emblem-wrap">
          <img className="connexion__emblem" src={emblemUrl} alt="SECTION 13" />
        </div>

        <form
          className="connexion__form"
          onSubmit={(event) => {
            event.preventDefault()
            onValidate()
          }}
        >
          <label className="connexion__label" htmlFor="acces-code">
            Saisissez votre code de connexion&nbsp;:
          </label>
          <input
            id="acces-code"
            className="connexion__input"
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={code}
            onChange={(event) => onCodeChange(event.target.value)}
            maxLength={64}
            // Single-purpose kiosk screen: the operator's only action is to type
            // the code, so focus it on mount.
            autoFocus
          />
          <button type="submit" className="connexion__submit">
            Valider
          </button>
        </form>
      </div>
    </main>
  )
}
