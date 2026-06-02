import { useCallback, useMemo } from 'react'
import { ConnexionScreen } from './ConnexionScreen'
import { SequenceRunner } from './components/SequenceRunner'
import { useAssautSequence } from './useAssautSequence'
import { useGameState } from './persistence'
import { useServerHandshake } from './sync'

declare global {
  interface Window {
    readonly assaut?: import('@shared/ipc').AssautBridge
  }
}

export default function App(): JSX.Element {
  const { state, setState, getLatest, ready } = useGameState()
  const wsUrl = useMemo(() => `ws://${state.serverIp}:8080/ws`, [state.serverIp])
  const { connection } = useServerHandshake({ url: wsUrl, state, ready })
  const sequence = useAssautSequence()

  const onCodeChange = useCallback(
    (next: string) => {
      // Persist on every keystroke. Read latest via getLatest() rather than
      // closing over `state` so two keystrokes between renders can't merge from
      // a stale base. electron-store is sync, so a force-kill right after the
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
