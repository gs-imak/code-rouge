import type { ConnectionState } from '@code-rouge/shared-utils'
import { ScreenChrome } from './ScreenChrome'
import { SectionHeader } from './SectionHeader'
import { PrimaryButton } from './PrimaryButton'
import { HudBrackets } from './HudBrackets'
import './AdminScreen.css'

// « Admin et paramétrages » (maquette screen 1): the GM setup screen. Four
// tactical panels — réseau diagnostic, hardware status, session control, session
// config — plus the « Transmettre au serveur » / « Sauvegarder » actions. The
// network dot reflects the live NUC handshake; battery/wifi are placeholders
// (no native hardware API yet); the selects' options are content (parcours /
// équipe / étape) filled from config when the data lands.

export interface AdminScreenProps {
  readonly connection: ConnectionState
  readonly onReset: () => void
  readonly onTransmit: () => void
  readonly onSave: () => void
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
        <div className="admin__grid">
          <section className="admin-panel">
            <HudBrackets />
            <h2 className="admin-panel__title">Diagnostic réseau</h2>
            <div className="admin-panel__body">
              <div className="admin-row">
                <span>État de la connexion avec le serveur local</span>
                <span className={online ? 'admin-dot admin-dot--ok' : 'admin-dot'} />
              </div>
            </div>
          </section>

          <section className="admin-panel">
            <HudBrackets />
            <h2 className="admin-panel__title">État matériel</h2>
            <div className="admin-panel__body admin-panel__hw">
              <div className="admin-hw">
                <span className="admin-hw__label">Batterie</span>
                <span className="admin-dots">
                  <i className="admin-dot admin-dot--ok" />
                  <i className="admin-dot admin-dot--ok" />
                  <i className="admin-dot admin-dot--ok" />
                </span>
              </div>
              <div className="admin-hw">
                <span className="admin-hw__label">Wifi</span>
                <span className="admin-dots">
                  <i className="admin-dot admin-dot--ok" />
                  <i className="admin-dot admin-dot--ok" />
                  <i className="admin-dot admin-dot--ok" />
                </span>
              </div>
            </div>
          </section>

          <section className="admin-panel">
            <HudBrackets />
            <h2 className="admin-panel__title">Contrôle de session</h2>
            <div className="admin-panel__body">
              <div className="admin-field">
                <span className="admin-field__label">Réinitialiser la session de jeu :</span>
                <button type="button" className="admin-reset" onClick={onReset}>
                  Reset ↻
                </button>
              </div>
              <label className="admin-field">
                <span className="admin-field__label">Sélectionnez votre étape de jeu :</span>
                <select className="admin-select" defaultValue="">
                  <option value="">1 - Nom de l’étape</option>
                </select>
              </label>
            </div>
          </section>

          <section className="admin-panel">
            <HudBrackets />
            <h2 className="admin-panel__title">Paramétrage de session</h2>
            <div className="admin-panel__body">
              <label className="admin-field">
                <span className="admin-field__label">Sélectionnez le parcours de jeu :</span>
                <select className="admin-select" defaultValue="">
                  <option value="">Nom du parcours</option>
                </select>
              </label>
              <label className="admin-field">
                <span className="admin-field__label">Sélectionnez l’équipe :</span>
                <select className="admin-select" defaultValue="">
                  <option value="">1 - Nom de l’équipe</option>
                </select>
              </label>
              <button type="button" className="admin-custom">
                Personnaliser votre session ⚙
              </button>
            </div>
          </section>
        </div>

        <div className="admin__footer">
          <PrimaryButton tone="dark" onClick={onTransmit}>
            Transmettre au serveur
          </PrimaryButton>
          <PrimaryButton onClick={onSave}>Sauvegarder</PrimaryButton>
        </div>
      </div>
    </ScreenChrome>
  )
}
