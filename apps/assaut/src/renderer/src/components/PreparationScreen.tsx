import { ScreenChrome } from './ScreenChrome'
import { SectionHeader } from './SectionHeader'
import { ArrowRightIcon } from './icons'
import './PreparationScreen.css'

// « Préparation » hub (maquette screen 4): three action cards. « Lancer l'assaut »
// is the highlighted primary action. NOTE: the maquette label reads « Choisisser »
// (typo); shipped as the correct « Choisir » — flagged for the graphiste.

export interface PreparationScreenProps {
  readonly onAddPoint: () => void
  readonly onChooseApproach: () => void
  readonly onLaunch: () => void
  readonly headerTitle?: string
}

export function PreparationScreen({
  onAddPoint,
  onChooseApproach,
  onLaunch,
  headerTitle = 'Préparation de l’assaut',
}: PreparationScreenProps): JSX.Element {
  return (
    <ScreenChrome header={<SectionHeader title={headerTitle} />}>
      <div className="prep-hub">
        <button type="button" className="prep-hub__card" onClick={onAddPoint}>
          <span className="prep-hub__label">Ajouter un point d’accès</span>
          <span className="prep-hub__arrow" aria-hidden="true">
            <ArrowRightIcon />
          </span>
        </button>
        <button type="button" className="prep-hub__card" onClick={onChooseApproach}>
          <span className="prep-hub__label">Choisir l’approche pour l’intervention</span>
          <span className="prep-hub__arrow" aria-hidden="true">
            <ArrowRightIcon />
          </span>
        </button>
        <button
          type="button"
          className="prep-hub__card prep-hub__card--primary"
          onClick={onLaunch}
        >
          <span className="prep-hub__label">Lancer l’assaut</span>
          <span className="prep-hub__arrow" aria-hidden="true">
            <ArrowRightIcon />
          </span>
        </button>
      </div>
    </ScreenChrome>
  )
}
