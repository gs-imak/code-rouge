import type { ConnectionState } from '@code-rouge/shared-utils'
import { ScreenChrome } from './ScreenChrome'
import { SectionHeader } from './SectionHeader'
import { HudBrackets } from './HudBrackets'
import './AdminScreen.css'

// « Admin et paramétrages » (maquette frame 9:1028): the GM setup screen. Four
// tactical panels — réseau diagnostic, hardware status, session control, session
// config — plus « Transmettre au serveur » / « Sauvegarder ». Every element is
// absolutely positioned at its exact maquette frame coordinate (body = frame_Y −
// 78 for the 7.8rem header). The network dot reflects the live NUC handshake;
// battery/wifi + the selects' options are content placeholders.

export interface AdminScreenProps {
  readonly connection: ConnectionState
  readonly onReset: () => void
  readonly onTransmit: () => void
  readonly onSave: () => void
}

// Six-dot indicator (maquette « Ellipse 302-307 », 30px, 8px gap): `filled`
// leading dots solid white, the rest white@30% outlines.
function Dots({ filled }: { readonly filled: number }): JSX.Element {
  return (
    <span className="admin-dots">
      {Array.from({ length: 6 }, (_, i) => (
        <i key={i} className={i < filled ? 'admin-dot admin-dot--on' : 'admin-dot'} />
      ))}
    </span>
  )
}

export function AdminScreen({
  connection,
  onReset,
  onTransmit,
  onSave,
}: AdminScreenProps): JSX.Element {
  const online = connection === 'connected'
  return (
    <ScreenChrome header={<SectionHeader title="Admin et paramétrages" />}>
      <div className="admin">
        {/* Diagnostic réseau (panel @[127,109 493×257]) */}
        <section className="admin-panel admin-panel--diag">
          <HudBrackets />
          <h2 className="admin-panel__title admin-diag__title">Diagnostic réseau</h2>
          <p className="admin-diag__text">État de la connexion avec le serveur local</p>
          <div className="admin-diag__dots">
            <Dots filled={online ? 6 : 1} />
          </div>
        </section>

        {/* État matériel (panel @[661,109 653×257]) */}
        <section className="admin-panel admin-panel--hw">
          <HudBrackets />
          <h2 className="admin-panel__title admin-hw__title">État matériel</h2>
          <div className="admin-hw admin-hw--bat">
            <span className="admin-hw__label">Batterie</span>
            <Dots filled={1} />
          </div>
          <div className="admin-hw admin-hw--wifi">
            <span className="admin-hw__label">Wifi</span>
            <Dots filled={1} />
          </div>
        </section>

        {/* Contrôle de session (panel @[127,396 489×493]) */}
        <section className="admin-panel admin-panel--ctrl">
          <HudBrackets />
          <h2 className="admin-panel__title admin-ctrl__title">Contrôle de session</h2>
          <p className="admin-ctrl__reset-label">Réinitialiser la session de jeu&nbsp;:</p>
          <button type="button" className="admin-reset" onClick={onReset}>
            Reset&nbsp;↻
          </button>
          <p className="admin-ctrl__step-label">Sélectionnez votre étape de jeu&nbsp;:</p>
          <select className="admin-select admin-ctrl__step" defaultValue="">
            <option value="">1 - Nom de l’étape</option>
          </select>
        </section>

        {/* Paramétrage de session (panel @[661,396 653×494]) */}
        <section className="admin-panel admin-panel--cfg">
          <HudBrackets />
          <h2 className="admin-panel__title admin-cfg__title">Paramétrage de session</h2>
          <p className="admin-cfg__parcours-label">Sélectionnez le parcours de jeu&nbsp;:</p>
          <select className="admin-select admin-cfg__parcours" defaultValue="">
            <option value="">Nom du parcours</option>
          </select>
          <p className="admin-cfg__team-label">Sélectionnez l’équipe&nbsp;:</p>
          <select className="admin-select admin-cfg__team" defaultValue="">
            <option value="">1 - Nom de l’équipe</option>
          </select>
          <button type="button" className="admin-custom">
            <span>Personnaliser votre session</span>
            <span aria-hidden="true">⚙</span>
          </button>
        </section>

        {/* Footer actions (@[411,927]) — Transmettre is the wide dark-teal variant. */}
        <button type="button" className="admin-action admin-action--transmit" onClick={onTransmit}>
          Transmettre au serveur
        </button>
        <button type="button" className="admin-action admin-action--save" onClick={onSave}>
          Sauvegarder
        </button>
      </div>
    </ScreenChrome>
  )
}
