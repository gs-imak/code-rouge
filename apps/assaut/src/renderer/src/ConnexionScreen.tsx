import type { ConnectionState } from '@code-rouge/shared-utils'
import { ScreenChrome } from './components/ScreenChrome'
import { SectionHeader } from './components/SectionHeader'
import emblemUrl from './assets/section13-emblem.svg'
import './ConnexionScreen.css'

// « Connexion » — the engine's `saisie-acces` prep step. Habillé 1-to-1 from the
// M2 maquette (Figma node 9:1382, .figma-ref/02-connexion.png): the shared
// tactical chrome (ScreenChrome) + the prep header (SectionHeader) + a central
// SECTION 13 emblem with a teal halo + the code prompt + the « Valider » button.
//
// Purely presentational: the access code value + persistence live in App
// (GameState.draftAuthCode); engine navigation lives in useAssautSequence. This
// keeps the component renderable by the browser screenshot harness with no
// Electron `window.assaut` bridge. UI strings stay French (CLAUDE.md lang rule).

export interface ConnexionScreenProps {
  /** Current access code (owned + persisted by App). */
  readonly code: string
  readonly onCodeChange: (next: string) => void
  /** Validate the code — advances past `saisie-acces` once navigation is wired. */
  readonly onValidate: () => void
  /** NUC link state. Not drawn (the maquette has no indicator on this screen);
   *  surfaced as a `data-nuc` attribute for tests / a future overlay. */
  readonly nucConnection?: ConnectionState
}

export function ConnexionScreen({
  code,
  onCodeChange,
  onValidate,
  nucConnection,
}: ConnexionScreenProps): JSX.Element {
  return (
    <ScreenChrome header={<SectionHeader title="Préparation de l’assaut" />}>
      <div className="connexion" data-nuc={nucConnection}>
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
    </ScreenChrome>
  )
}
