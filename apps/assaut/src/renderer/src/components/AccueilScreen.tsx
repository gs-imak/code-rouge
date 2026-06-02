import { ScreenChrome } from './ScreenChrome'
import { SectionHeader } from './SectionHeader'
import { PrimaryButton } from './PrimaryButton'
import './AccueilScreen.css'

// « Accueil » (maquette screen 3): welcome — « Bienvenue équipe {team} ! » + an
// intro paragraph (content) + « Commencer ». No panel; text sits on the chrome.

export interface AccueilScreenProps {
  readonly teamName: string
  /** Intro copy (content — placeholder until Nathanaël's text lands). */
  readonly body: string
  readonly onStart: () => void
  readonly headerTitle?: string
}

export function AccueilScreen({
  teamName,
  body,
  onStart,
  headerTitle = 'Préparation de l’assaut',
}: AccueilScreenProps): JSX.Element {
  return (
    <ScreenChrome header={<SectionHeader title={headerTitle} />}>
      <div className="accueil">
        <h2 className="accueil__title">
          Bienvenue équipe
          <br />
          {teamName} !
        </h2>
        <p className="accueil__body">{body}</p>
        <PrimaryButton onClick={onStart}>Commencer</PrimaryButton>
      </div>
    </ScreenChrome>
  )
}
