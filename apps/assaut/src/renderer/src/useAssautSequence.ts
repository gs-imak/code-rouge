import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AssautSequenceConfig } from '@code-rouge/shared-types'
import {
  advance,
  applyChoice,
  createSession,
  currentStep,
  type AssautPhase,
  type AssautSession,
} from './engine/assaut-sequence'

// Thin React glue over the pure Assaut engine (engine/assaut-sequence.ts is
// headless + unit-tested; per Senior-Reviewer rule #3 the hook holds no
// business logic). The sequence config is loaded at runtime over the
// `GetSequenceConfig` IPC channel (main reads assets/config/sequence.json via
// fs + Zod) — that channel + the SequenceRunner that maps `currentStep` → a
// screen land in the navigation slice. Until then callers pass `null`: the hook
// reports `ready: false` and the host renders the entry screen (Connexion /
// `saisie-acces`) by default, which also lets the browser screenshot harness
// run without the Electron bridge.

export interface UseAssautSequenceResult {
  /** True once a session exists (i.e. a config has been supplied). */
  readonly ready: boolean
  /** The current phase, or `null` before a config is loaded. */
  readonly phase: AssautPhase | null
  /** The active step descriptor, or `null` when dormant / complete. */
  readonly step: ReturnType<typeof currentStep>
  /** Running « % de données récupérées » (0 before a session exists). */
  readonly dataRecoveredPercent: number
  /** Advance a non-choice step (e.g. validate `saisie-acces`). No-op while dormant. */
  readonly submit: (event?: string) => void
  /** Resolve a branching choice on the current prep step. No-op while dormant. */
  readonly choose: (choiceId: string) => void
}

export function useAssautSequence(
  config: AssautSequenceConfig | null,
): UseAssautSequenceResult {
  const [session, setSession] = useState<AssautSession | null>(() =>
    config ? createSession(config) : null,
  )

  // Initialise the session when a config arrives after first render (the IPC
  // load resolves asynchronously). Restoring a persisted session — choices and
  // visit history via a dedicated store key — is the follow-up slice; the
  // baseline here is a fresh session at the entry step.
  useEffect(() => {
    if (config && session === null) {
      setSession(createSession(config))
    }
  }, [config, session])

  const submit = useCallback(
    (event?: string) => {
      if (config === null || session === null) return
      setSession(advance(config, session, event))
    },
    [config, session],
  )

  const choose = useCallback(
    (choiceId: string) => {
      if (config === null || session === null) return
      setSession(applyChoice(config, session, choiceId))
    },
    [config, session],
  )

  const step = useMemo(
    () => (config !== null && session !== null ? currentStep(config, session) : null),
    [config, session],
  )

  return {
    ready: session !== null,
    phase: session?.phase ?? null,
    step,
    dataRecoveredPercent: session?.dataRecoveredPercent ?? 0,
    submit,
    choose,
  }
}
