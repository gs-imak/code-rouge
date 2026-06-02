import { ScreenChrome } from './ScreenChrome'
import { SectionHeader } from './SectionHeader'
import './AssautStepScreen.css'

// Generic « Assaut lancé » step screen — the maquette's assault-phase layout
// (screens 13–24): assault header (live score + timer) + a HUD-bracketed media
// frame with a subtitle, optionally a column of 4 response buttons (interactive
// steps like Interaction), optionally a received-photo overlay (Mc Gyver Photo).
// Everything is config-driven so one component renders every assault step
// (immutable rule #2: data-driven). Media is a local file:// source at runtime;
// until content lands a placeholder waveform stands in (rule #3).

// Deterministic bar heights — a static audio-waveform placeholder (no RNG).
const WAVEFORM = Array.from({ length: 64 }, (_, i) =>
  28 + Math.round(60 * Math.abs(Math.sin(i * 0.6) * Math.cos(i * 0.17))),
)

export interface AssautResponse {
  readonly id: string
  readonly label: string
}

export interface AssautStepScreenProps {
  /** Header title (defaults to the prep/assault title). */
  readonly title?: string
  /** Live « % données récupérées » from the engine. */
  readonly dataRecoveredPercent: number
  /** Countdown label, e.g. « 10:05 ». */
  readonly timerLabel: string
  /** Step subtitle / chef-d’escouade line. */
  readonly subtitle: string
  /** Local file:// video source; absent → waveform placeholder. */
  readonly mediaSrc?: string
  /** Interactive steps: 4 response buttons. Absent/empty → passive step. */
  readonly responses?: readonly AssautResponse[]
  readonly onRespond?: (id: string) => void
  /** Optional received-photo overlay (Mc Gyver Photo). */
  readonly photo?: { readonly src: string; readonly onClose: () => void } | null
}

export function AssautStepScreen({
  title = 'Préparation de l’assaut',
  dataRecoveredPercent,
  timerLabel,
  subtitle,
  mediaSrc,
  responses,
  onRespond,
  photo,
}: AssautStepScreenProps): JSX.Element {
  const interactive = responses !== undefined && responses.length > 0
  return (
    <ScreenChrome
      header={
        <SectionHeader
          variant="assault"
          title={title}
          dataRecoveredPercent={dataRecoveredPercent}
          timerLabel={timerLabel}
        />
      }
    >
      <div className={interactive ? 'step step--interactive' : 'step'}>
        <div className="step__media">
          <span className="brackets brackets--tl" />
          <span className="brackets brackets--tr" />
          <span className="brackets brackets--bl" />
          <span className="brackets brackets--br" />

          {mediaSrc !== undefined ? (
            // Decorative assault footage; the subtitle below carries the line.
            <video className="step__video" src={mediaSrc} autoPlay loop muted playsInline />
          ) : (
            <div className="step__waveform" aria-hidden="true">
              {WAVEFORM.map((h, i) => (
                <span key={`bar-${i}`} style={{ height: `${h}%` }} />
              ))}
            </div>
          )}

          <p className="step__subtitle">{subtitle}</p>
        </div>

        {responses !== undefined && responses.length > 0 && (
          <div className="step__responses">
            {responses.map((response) => (
              <button
                key={response.id}
                type="button"
                className="step__response"
                onClick={() => onRespond?.(response.id)}
              >
                {response.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {photo != null && (
        <div className="step__overlay" role="dialog" aria-modal="true" aria-label="Image reçue">
          <div className="step__photo">
            <button
              type="button"
              className="step__photo-close"
              onClick={photo.onClose}
              aria-label="Fermer l’image"
            >
              ×
            </button>
            <img src={photo.src} alt="" />
          </div>
        </div>
      )}
    </ScreenChrome>
  )
}
