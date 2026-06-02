import { ScreenChrome } from './ScreenChrome'
import { SectionHeader } from './SectionHeader'
import { Panel } from './Panel'
import { PrimaryButton } from './PrimaryButton'
import { RadarIcon } from './icons'
import './ChoixApprocheScreen.css'

// « Choix Approche » (maquette screen 8 + selected state 8-3): pick frontale vs
// furtive. The chosen card is highlighted, the other dimmed. NOTE: the maquette
// labels read « Assault » (English); shipped as the French « Assaut » to match
// the app name — flagged for the graphiste. Approach ids map to the engine's
// `choix-approche` choices (frontale | furtive).

export type ApprocheOption = 'frontale' | 'furtive'

export interface ChoixApprocheScreenProps {
  readonly selected: ApprocheOption | null
  readonly onSelect: (option: ApprocheOption) => void
  readonly onValidate: () => void
  readonly headerTitle?: string
}

export function ChoixApprocheScreen({
  selected,
  onSelect,
  onValidate,
  headerTitle = 'Préparation de l’assaut',
}: ChoixApprocheScreenProps): JSX.Element {
  const cardClass = (option: ApprocheOption): string =>
    selected === option ? 'choix__card choix__card--selected' : 'choix__card'
  return (
    <ScreenChrome header={<SectionHeader title={headerTitle} />}>
      <form
        className="choix"
        onSubmit={(event) => {
          event.preventDefault()
          onValidate()
        }}
      >
        <Panel>
          <div className="choix__icon">
            <RadarIcon size={78} />
          </div>
          <h2 className="choix__title">Bonjour opérateur</h2>
          <p className="choix__text">
            Veuillez choisir l’approche que l’équipe d’intervention devra adopter pour
            donner l’assaut à la planque du Réseau.
          </p>
          <div className="choix__cards">
            <button
              type="button"
              className={cardClass('frontale')}
              onClick={() => onSelect('frontale')}
              aria-pressed={selected === 'frontale'}
            >
              <span className="choix__card-img choix__card-img--frontale" aria-hidden="true" />
              <span className="choix__card-label">Assaut frontal</span>
            </button>
            <button
              type="button"
              className={cardClass('furtive')}
              onClick={() => onSelect('furtive')}
              aria-pressed={selected === 'furtive'}
            >
              <span className="choix__card-img choix__card-img--furtive" aria-hidden="true" />
              <span className="choix__card-label">Assaut furtif</span>
            </button>
          </div>
        </Panel>
        <PrimaryButton type="submit">Valider</PrimaryButton>
      </form>
    </ScreenChrome>
  )
}
