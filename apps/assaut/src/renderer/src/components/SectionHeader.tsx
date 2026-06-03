import logoUrl from '../assets/section13-header-logo.svg'
import stopwatchUrl from '../assets/icon-stopwatch.svg'
import imageIconUrl from '../assets/icon-image.svg'
import './SectionHeader.css'

// The maquette's `Header` component, both variants:
//  - 'prep'    : logo lockup + centered title (Connexion, Accueil, Point d'accès…).
//  - 'assault' : adds the live « Données récupérées » gauge + countdown timer,
//                driven by the engine (dataRecoveredPercent + timerLabel).
// Logo lockup + icons are exact maquette vectors. Title stays French.

export interface SectionHeaderProps {
  /** Centered bar title, e.g. « Préparation de l’assaut ». */
  readonly title: string
  /** 'prep' (default) or 'assault' (with score gauge + timer). */
  readonly variant?: 'prep' | 'assault'
  /** « % données récupérées » (0–100). Assault variant only. */
  readonly dataRecoveredPercent?: number
  /** Countdown label, e.g. « 10:05 ». Assault variant only. */
  readonly timerLabel?: string
}

export function SectionHeader({
  title,
  variant = 'prep',
  dataRecoveredPercent = 0,
  timerLabel,
}: SectionHeaderProps): JSX.Element {
  const pct = Math.max(0, Math.min(100, Math.round(dataRecoveredPercent)))
  return (
    <header className={`section-header section-header--${variant}`}>
      <div className="section-header__brand">
        <img className="section-header__logo" src={logoUrl} alt="SECTION 13" />
        {variant === 'assault' && (
          <img className="section-header__image-icon" src={imageIconUrl} alt="" aria-hidden="true" />
        )}
      </div>

      <h1 className="section-header__title">{title}</h1>

      {variant === 'assault' && (
        <div className="section-header__hud">
          <div className="gauge">
            <span className="gauge__label">Données récupérées&nbsp;:</span>
            <div className="gauge__row">
              <div className="gauge__track">
                <div className="gauge__fill" style={{ width: `${pct}%` }} />
              </div>
              <span className="gauge__pct">
                {pct}
                <span className="gauge__pct-sign">%</span>
              </span>
            </div>
          </div>
          <div className="timer">
            <img className="timer__icon" src={stopwatchUrl} alt="" aria-hidden="true" />
            <span className="timer__value">{timerLabel ?? '--:--'}</span>
          </div>
        </div>
      )}
    </header>
  )
}
