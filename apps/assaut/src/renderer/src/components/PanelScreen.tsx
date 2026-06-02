import { ScreenChrome } from './ScreenChrome'
import { SectionHeader } from './SectionHeader'
import { Panel } from './Panel'
import { PrimaryButton } from './PrimaryButton'
import { CheckIcon, CrossIcon, RadarIcon } from './icons'
import './PanelScreen.css'

// Flexible panel screen covering the maquette's prompt + result + info screens.
// One component, data-driven (immutable rule #2); text comes via props. The
// three maquette layouts (exact frame coords drive the rem in PanelScreen.css):
//  - 'input'   : prompt panel @142 + input @633 + button @843 — Ajout Point
//                d'accès (5), Code d'autorisation (10). icon='radar' + input.
//  - 'result'  : panel @231 + button @843 — Refus (7, tone=danger, narrow) and
//                Validation (6, tone=success, wide panel + photo on the right).
//  - 'message' : single popin @192 with the button INSIDE — Accueil Assaut (11).
// Layout is derived from the props so the call sites stay declarative.

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

// Maquette icon sizes: radar reticle 78×78 ("broadcast 1"), result badge 89×89.
function renderIcon(icon: NonNullable<PanelScreenProps['icon']>): JSX.Element | null {
  switch (icon) {
    case 'radar':
      return <RadarIcon size={78} />
    case 'check':
      return <CheckIcon size={89} />
    case 'cross':
      return <CrossIcon size={89} />
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
  const layout = input !== undefined ? 'input' : tone !== 'default' || photoSrc !== undefined ? 'result' : 'message'
  const wide = photoSrc !== undefined
  const rootClass = `panel-screen panel-screen--${layout}${wide ? ' panel-screen--wide' : ''}`

  const button = (
    <PrimaryButton type="submit" className="panel-screen__button">
      {buttonLabel}
    </PrimaryButton>
  )

  return (
    <ScreenChrome header={<SectionHeader title={headerTitle} />}>
      <form
        className={rootClass}
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <div className="panel-screen__panel">
          <Panel tone={tone}>
            {/* Text column (icon/badge + title + body). On the wide validation
                panel the photo sits beside it; the panel becomes a flex row. */}
            <div className="panel-screen__main">
              {iconEl !== null && <div className="panel-screen__icon">{iconEl}</div>}
              <h2 className="panel-screen__title">{title}</h2>
              <p className="panel-screen__text">{text}</p>
            </div>
            {photoSrc !== undefined && (
              <img className="panel-screen__photo" src={photoSrc} alt="" />
            )}
            {layout === 'message' && button}
          </Panel>
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

        {layout !== 'message' && <div className="panel-screen__action">{button}</div>}
      </form>
    </ScreenChrome>
  )
}
