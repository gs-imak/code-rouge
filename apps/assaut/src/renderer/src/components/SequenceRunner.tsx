import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import type { AssautPrepStep, AssautStep } from '@code-rouge/shared-types'
import type { ConnectionState } from '@code-rouge/shared-utils'
import { ConnexionScreen } from '../ConnexionScreen'
import { AccueilScreen } from './AccueilScreen'
import { PreparationScreen } from './PreparationScreen'
import { ChoixApprocheScreen, type ApprocheOption } from './ChoixApprocheScreen'
import { PanelScreen } from './PanelScreen'
import { AssautStepScreen, type AssautResponse } from './AssautStepScreen'
import { TutoScreen } from './TutoScreen'

// Maps the engine's current step (by `kind`) to its screen and wires the screen's
// actions back to the engine (advance / applyChoice). This is the only place that
// switches on step.kind — screens stay presentational, the engine stays headless
// (immutable rule #2). The flow is data-driven by sequence.json.
//
// Linear-default notes: the « préparation » hub advances linearly (its real 3-way
// branching + the GM-driven point-d'accès approval are content + WS, layered on
// later). Screens the maquette gives no button (tuto, passive assault steps)
// advance via a transparent overlay here; in the real game they advance on
// media-end / timer.

export interface SequenceRunnerProps {
  readonly step: AssautPrepStep | AssautStep
  readonly dataRecoveredPercent: number
  readonly onSubmit: (event?: string) => void
  readonly onChoose: (choiceId: string) => void
  /** Persisted access code (saisie-acces), owned by App. */
  readonly authCode: string
  readonly onAuthCodeChange: (next: string) => void
  /** Team label for the welcome screen (content; placeholder until real data). */
  readonly teamName?: string
  readonly nucConnection?: ConnectionState
  /**
   * Real game: submit the entry point to the GM over WS instead of advancing
   * linearly — the engine then waits for `access-result` to drive the
   * Validation/Refus screens. Absent in the dev gallery / DevFlow (no WS), where
   * point-d'entrée advances linearly so the flow stays click-through testable.
   */
  readonly onSubmitAccessPoint?: (point: string) => void
  /** GM-issued authorisation code that pre-fills the « attente code MG » screen. */
  readonly mgCode?: string | null
}

const OVERLAY_STYLE: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 50,
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
}

// Full-screen transparent advance affordance for screens the maquette gives no
// button (tutorial, passive assault steps). A real <button> for keyboard + a11y.
function AdvanceOverlay({ onAdvance }: { readonly onAdvance: () => void }): JSX.Element {
  return <button type="button" style={OVERLAY_STYLE} aria-label="Continuer" onClick={onAdvance} />
}

function formatTimer(seconds: number | undefined): string {
  if (seconds === undefined) return '10:05'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// Live per-step countdown: ticks the step's `timerSec` down once a second,
// resetting whenever the step changes and holding at 0 (timer-end → flow advance
// is content/CDC, not invented here). Steps with no `timerSec` keep the maquette
// default label. The timer is ephemeral UI state — a restore restarts it from the
// step's nominal duration rather than resuming a remembered remainder.
function useCountdown(totalSeconds: number | undefined, stepId: string): number | undefined {
  const [remaining, setRemaining] = useState(totalSeconds)
  useEffect(() => {
    setRemaining(totalSeconds)
    if (totalSeconds === undefined) return undefined
    const id = setInterval(() => {
      setRemaining((r) => (r === undefined || r <= 0 ? r : r - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [totalSeconds, stepId])
  return remaining
}

function extractResponses(config: Record<string, unknown>): AssautResponse[] {
  const raw = config['responses']
  if (!Array.isArray(raw)) return []
  return raw
    .filter((label): label is string => typeof label === 'string')
    .map((label, index) => ({ id: `r${index + 1}`, label }))
}

export function SequenceRunner({
  step,
  dataRecoveredPercent,
  onSubmit,
  onChoose,
  authCode,
  onAuthCodeChange,
  teamName = 'Opérateurs',
  nucConnection,
  onSubmitAccessPoint,
  mgCode,
}: SequenceRunnerProps): JSX.Element {
  // Transient per-step input + selection, reset whenever the step changes.
  const [panelInput, setPanelInput] = useState('')
  const [selected, setSelected] = useState<ApprocheOption | null>(null)
  useEffect(() => {
    setPanelInput('')
    setSelected(null)
  }, [step.id])

  const remaining = useCountdown('timerSec' in step ? step.timerSec : undefined, step.id)
  const timerLabel = formatTimer(remaining)

  switch (step.kind) {
    case 'saisie-acces':
      return (
        <ConnexionScreen
          code={authCode}
          onCodeChange={onAuthCodeChange}
          onValidate={() => onSubmit()}
          nucConnection={nucConnection}
        />
      )

    case 'accueil':
      return (
        <AccueilScreen
          teamName={teamName}
          body="L'opération démarre. Préparez votre équipe avant de lancer l'assaut sur la planque du Réseau."
          onStart={() => onSubmit()}
        />
      )

    case 'preparation':
      return (
        <PreparationScreen
          onAddPoint={() => onSubmit()}
          onChooseApproach={() => onSubmit()}
          onLaunch={() => onSubmit()}
        />
      )

    case 'point-entree':
      return (
        <PanelScreen
          icon="radar"
          title="Bonjour opérateur"
          text="Veuillez saisir le point d'entrée dans la planque que vous souhaitez soumettre à approbation."
          input={{ label: "Saisir le point d'entrée :", value: panelInput, onChange: setPanelInput }}
          buttonLabel="Valider"
          onSubmit={() => (onSubmitAccessPoint ? onSubmitAccessPoint(panelInput) : onSubmit())}
        />
      )

    case 'point-acces-valide':
      return (
        <PanelScreen
          tone="success"
          icon="check"
          title="Félicitations opérateurs !"
          text="Point d'accès validé et disponible pour la suite."
          buttonLabel="Continuer"
          onSubmit={() => onSubmit()}
        />
      )

    case 'point-acces-refus':
      return (
        <PanelScreen
          tone="danger"
          icon="cross"
          title="Échec"
          text="Accès non approprié. Veuillez vous en tenir aux accès déjà identifiés."
          buttonLabel="Recommencer"
          onSubmit={() => onSubmit()}
        />
      )

    case 'choix-approche':
      return (
        <ChoixApprocheScreen
          selected={selected}
          onSelect={setSelected}
          onValidate={() => onChoose(selected ?? 'frontale')}
        />
      )

    case 'attente-code-mg':
      return (
        <PanelScreen
          icon="radar"
          title="Bonjour opérateur"
          text="Veuillez saisir le code d'autorisation pour lancer l'assaut sur la planque."
          input={{
            label: "Saisissez le code d'autorisation :",
            // The GM transmits the code over WS (mg-code); show it once it arrives,
            // else the team's own typing while they wait.
            value: mgCode ?? panelInput,
            onChange: setPanelInput,
          }}
          buttonLabel="Valider"
          onSubmit={() => onSubmit()}
        />
      )

    case 'accueil-assaut':
      return (
        <PanelScreen
          title="Opérateur,"
          text="L'assaut sur la planque du Réseau est sur le point d'être initié. Quelques rappels sur le fonctionnement de votre interface tactique vont suivre …"
          buttonLabel="C'est parti !"
          onSubmit={() => onSubmit()}
        />
      )

    case 'tuto':
      return (
        <>
          <TutoScreen dataRecoveredPercent={dataRecoveredPercent} timerLabel={timerLabel} />
          <AdvanceOverlay onAdvance={() => onSubmit()} />
        </>
      )

    // Assault-phase steps (debut … epilogue): one generic screen, interactive
    // when the step declares responses, else a transparent advance overlay.
    default: {
      const responses = extractResponses(step.config)
      const interactive = responses.length > 0
      return (
        <>
          <AssautStepScreen
            dataRecoveredPercent={dataRecoveredPercent}
            timerLabel={timerLabel}
            subtitle=""
            responses={interactive ? responses : undefined}
            onRespond={(id) => onSubmit(id)}
          />
          {!interactive && <AdvanceOverlay onAdvance={() => onSubmit()} />}
        </>
      )
    }
  }
}
