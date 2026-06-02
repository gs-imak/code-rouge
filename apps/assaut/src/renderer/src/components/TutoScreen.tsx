import { ScreenChrome } from './ScreenChrome'
import { SectionHeader } from './SectionHeader'
import { HudBrackets } from './HudBrackets'
import './TutoScreen.css'

// « Tuto Assaut lancé » (maquette screen 12): the assault interface annotated
// for the players — callouts explaining the media area, the score, the timer
// and the response buttons. Illustrative (no live interaction); the flow
// advances to the first real assault step. Score/timer mirror the header.

// Static waveform placeholder (matches AssautStepScreen's; deterministic, no RNG).
const WAVEFORM = Array.from({ length: 64 }, (_, i) =>
  28 + Math.round(60 * Math.abs(Math.sin(i * 0.6) * Math.cos(i * 0.17))),
)

export interface TutoScreenProps {
  readonly dataRecoveredPercent?: number
  readonly timerLabel?: string
}

export function TutoScreen({
  dataRecoveredPercent = 27,
  timerLabel = '10:05',
}: TutoScreenProps): JSX.Element {
  return (
    <ScreenChrome
      header={
        <SectionHeader
          variant="assault"
          title="Préparation de l’assaut"
          dataRecoveredPercent={dataRecoveredPercent}
          timerLabel={timerLabel}
        />
      }
    >
      <div className="tuto">
        <p className="tuto__note tuto__note--image">
          Si le chef d’escouade doit vous envoyer une image, elle sera ici
        </p>
        <p className="tuto__note tuto__note--score">
          Pourcentage des données récupérées qui varie selon vos décisions
        </p>
        <p className="tuto__note tuto__note--timer">
          Temps restant pour répondre au chef d’escouade
        </p>
        <p className="tuto__note tuto__note--responses">
          Boutons interactifs pour communiquer avec le chef d’escouade
        </p>

        <div className="tuto__stage">
          <div className="tuto__media">
            <HudBrackets />
            <div className="tuto__waveform" aria-hidden="true">
              {WAVEFORM.map((h, i) => (
                <span key={`bar-${i}`} style={{ height: `${h}%` }} />
              ))}
            </div>
            <p className="tuto__media-caption">
              Affichage de la caméra embarquée du chef de l’escouade d’intervention
            </p>
          </div>

          <div className="tuto__responses">
            <p className="tuto__responses-heading">Réponses possibles&nbsp;:</p>
            <span className="tuto__response">Réponse 1</span>
            <span className="tuto__response">Réponse 2</span>
            <span className="tuto__response">Réponse 3</span>
            <span className="tuto__response">Réponse 4</span>
          </div>
        </div>
      </div>
    </ScreenChrome>
  )
}
