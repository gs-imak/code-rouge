import { useCallback, useMemo } from 'react'
import { ConnexionScreen } from './ConnexionScreen'
import { useAssautSequence } from './useAssautSequence'
import { useGameState } from './persistence'
import { useServerHandshake } from './sync'

declare global {
  interface Window {
    readonly assaut?: import('@shared/ipc').AssautBridge
  }
}

// The Assaut sequence config is loaded at runtime over the `GetSequenceConfig`
// IPC channel (main reads assets/config/sequence.json via fs + Zod, exposed
// through electron-builder extraResources). That channel + the SequenceRunner
// that maps `currentStep` → a screen are the next slice; until then the config
// is null, the engine session is dormant, and the entry screen (Connexion /
// `saisie-acces`) renders by default. Importing the JSON at build time is
// deliberately avoided — content is edited without recompiling (immutable
// rule #2: architecture is data-driven).
const SEQUENCE_CONFIG = null

export default function App(): JSX.Element {
  const { state, setState, getLatest, ready } = useGameState()
  const wsUrl = useMemo(() => `ws://${state.serverIp}:8080/ws`, [state.serverIp])
  const { connection } = useServerHandshake({ url: wsUrl, state, ready })
  const sequence = useAssautSequence(SEQUENCE_CONFIG)

  const onCodeChange = useCallback(
    (next: string) => {
      // Persist on every keystroke. Read latest via getLatest() rather than
      // closing over `state` so two keystrokes between renders can't merge from
      // the same stale base. electron-store is sync on-disk, so a force-kill
      // immediately after the keypress preserves the buffer. Bounded to 64
      // chars by the GameState schema.
      const current = getLatest()
      void setState({ ...current, draftAuthCode: next.slice(0, 64), lastSync: Date.now() })
    },
    [setState, getLatest],
  )

  const onValidate = useCallback(() => {
    // Advances past `saisie-acces` once the sequence config is wired in. A no-op
    // while the engine session is dormant (see SEQUENCE_CONFIG above).
    sequence.submit()
  }, [sequence])

  // Hold first paint until the persisted state is known. The empty container
  // carries the page background so there's no flash before the screen mounts.
  if (!ready) {
    return <div className="connexion" aria-hidden="true" />
  }

  // The screen for the current engine step. Until the SequenceRunner slice maps
  // every step.kind, the entry screen is Connexion (`saisie-acces`).
  return (
    <ConnexionScreen
      code={state.draftAuthCode}
      onCodeChange={onCodeChange}
      onValidate={onValidate}
      nucConnection={connection}
    />
  )
}
