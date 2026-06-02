import logoUrl from '../assets/section13-header-logo.svg'
import './SectionHeader.css'

// The maquette's `Header` component — the prep variant (logo lockup + centered
// title). The assault variant (live « Données récupérées » gauge + countdown
// timer) is a separate concern wired when the assault screens land; it reuses
// this bar with the score/timer driven by the engine. The logo lockup is the
// exact maquette vector (Figma node 9:1168). Title stays French.

export interface SectionHeaderProps {
  /** Centered bar title, e.g. « Préparation de l’assaut » or « Admin et paramétrages ». */
  readonly title: string
}

export function SectionHeader({ title }: SectionHeaderProps): JSX.Element {
  return (
    <header className="section-header">
      <img className="section-header__logo" src={logoUrl} alt="SECTION 13" />
      <h1 className="section-header__title">{title}</h1>
    </header>
  )
}
