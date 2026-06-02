import { ScreenChrome } from './ScreenChrome'
import { SectionHeader } from './SectionHeader'
import { Panel } from './Panel'
import { PrimaryButton } from './PrimaryButton'
import { CheckIcon, CrossIcon, RadarIcon } from './icons'
import './PanelScreen.css'

// Flexible panel screen covering the maquette's prompt + result + info screens:
//  - Ajout Point d'accès (5) / Code d'autorisation (10): icon='radar' + input.
//  - Validation Point d'accès (6): tone='success', icon='check', photo.
//  - Refus Point d'accès (7): tone='danger', icon='cross'.
//  - Accueil Assaut lancé (11): no icon, no input.
// One component, data-driven (immutable rule #2). Text comes via props (strings,
// so apostrophes need no escaping); the button submits the optional form.

export interface PanelScreenProps {
  readonly headerTitle?: string
  readonly tone?: 'default' | 'success' | 'danger'
  readonly icon?: 'radar' | 'check' | 'cross' | 'none'
  readonly title: string
  readonly text: string
  readonly photoSrc?: string
  readonly input?: {
    readonly label: string
    readonly value: string
    readonly onChange: (next: string) => void
  }
  readonly buttonLabel: string
  readonly onSubmit: () => void
}

function renderIcon(icon: NonNullable<PanelScreenProps['icon']>): JSX.Element | null {
  switch (icon) {
    case 'radar':
      return <RadarIcon />
    case 'check':
      return <CheckIcon />
    case 'cross':
      return <CrossIcon />
    default:
      return null
  }
}

export function PanelScreen({
  headerTitle = 'Préparation de l’assaut',
  tone = 'default',
  icon = 'none',
  title,
  text,
  photoSrc,
  input,
  buttonLabel,
  onSubmit,
}: PanelScreenProps): JSX.Element {
  const iconEl = renderIcon(icon)
  return (
    <ScreenChrome header={<SectionHeader title={headerTitle} />}>
      <form
        className="panel-screen"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <Panel tone={tone}>
          {iconEl !== null && <div className="panel-screen__icon">{iconEl}</div>}
          <h2 className="panel-screen__title">{title}</h2>
          <div
            className={
              photoSrc !== undefined
                ? 'panel-screen__body panel-screen__body--with-photo'
                : 'panel-screen__body'
            }
          >
            <p className="panel-screen__text">{text}</p>
            {photoSrc !== undefined && (
              <img className="panel-screen__photo" src={photoSrc} alt="" />
            )}
          </div>
          {input !== undefined && (
            <label className="panel-screen__field">
              <span className="panel-screen__field-label">{input.label}</span>
              <input
                className="panel-screen__input"
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={input.value}
                onChange={(event) => input.onChange(event.target.value)}
                maxLength={64}
              />
            </label>
          )}
        </Panel>
        <PrimaryButton type="submit">{buttonLabel}</PrimaryButton>
      </form>
    </ScreenChrome>
  )
}
