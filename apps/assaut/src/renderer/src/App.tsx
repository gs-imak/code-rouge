import { useCallback, useMemo, useState } from 'react'
import { ConnexionScreen } from './ConnexionScreen'
import { SequenceRunner } from './components/SequenceRunner'
import { useAssautSequence } from './useAssautSequence'
import { useGameState } from './persistence'
import { useServerHandshake } from './sync'
import { projectToGameState } from './engine/session-bridge'
import type { AssautSession } from './engine/assaut-sequence'

declare global {
  interface Window {
    readonly assaut?: import('@shared/ipc').AssautBridge
  }
}

export default function App(): JSX.Element {
  const { state, setState, getLatest, ready } = useGameState()
  const wsUrl = useMemo(() => `ws://${state.serverIp}:8080/ws`, [state.serverIp])
  // GM-issued authorisation code for the « attente code MG » screen (arrives over WS).
  const [mgCode, setMgCode] = useState<string | null>(null)

  // Project each engine transition onto GameState — persists currentStep+score for
  // the NUC sync + the fallback restore. getLatest() reads the freshest base so two
  // transitions between renders can't merge from a stale one. The full choices/visited
  // blob is owned by the sequence hook (setSession); this only mirrors the synced fields.
  const onCommit = useCallback(
    (session: AssautSession) => {
      const next = projectToGameState(session, getLatest())
      void setState({ ...next, lastSync: Date.now() })
    },
    [getLatest, setState],
  )

  const sequence = useAssautSequence({ ready, initialGameState: state, onCommit })

  const { connection, submitAccessPoint } = useServerHandshake({
    url: wsUrl,
    state,
    ready,
    // GM verdict on the submitted entry point → drive the Validation/Refus screens
    // by advancing the engine with the decision as the transition event (the flow
    // config routes 'approved'/'refused' to point-acces-valide/refus).
    onAccessResult: (decision) => sequence.submit(decision),
    // GM-issued authorisation code → fill the « attente code MG » screen.
    onMgCode: (code) => setMgCode(code),
  })

  const onCodeChange = useCallback(
    (next: string) => {
      // Persist on every keystroke. Read latest via getLatest() rather than closing
      // over `state` so two keystrokes between renders can't merge from a stale base.
      // electron-store-free JSON store is sync, so a force-kill right after the
      // keypress preserves the buffer. Bounded to 64 chars by the GameState schema.
      const current = getLatest()
      void setState({ ...current, draftAuthCode: next.slice(0, 64), lastSync: Date.now() })
    },
    [setState, getLatest],
  )

  // Hold first paint until the persisted state is known (no flash).
  if (!ready) {
    return <div className="screen" aria-hidden="true" />
  }

  // Engine-driven: render the screen for the current step. The flow config loads
  // over the GetSequenceConfig IPC channel; until it does (or without the Electron
  // bridge — browser screenshot harness), fall back to the entry screen.
  if (sequence.step !== null) {
    return (
      <SequenceRunner
        step={sequence.step}
        dataRecoveredPercent={sequence.dataRecoveredPercent}
        onSubmit={sequence.submit}
        onChoose={sequence.choose}
        onSubmitAccessPoint={submitAccessPoint}
        mgCode={mgCode}
        authCode={state.draftAuthCode}
        onAuthCodeChange={onCodeChange}
        teamName={state.teamId !== null ? `Équipe ${state.teamId}` : 'Opérateurs'}
        nucConnection={connection}
      />
    )
  }

  return (
    <ConnexionScreen
      code={state.draftAuthCode}
      onCodeChange={onCodeChange}
      onValidate={() => undefined}
      nucConnection={connection}
    />
  )
}
