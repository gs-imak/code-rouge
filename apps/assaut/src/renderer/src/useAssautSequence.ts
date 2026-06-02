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

// React glue over the pure Assaut engine (engine/assaut-sequence.ts is headless +
// unit-tested; per Senior-Reviewer rule #3 the hook holds no business logic). The
// flow config is loaded at runtime over the `GetSequenceConfig` IPC channel (main
// reads assets/config/sequence.json via fs + Zod). Without the Electron bridge
// (browser screenshot harness / dev gallery) the hook stays dormant and the host
// renders the entry screen by default. Restoring a persisted session (choices +
// visit history) is the follow-up slice; the baseline is a fresh session.

export interface UseAssautSequenceResult {
  readonly ready: boolean
  readonly phase: AssautPhase | null
  readonly step: ReturnType<typeof currentStep>
  readonly dataRecoveredPercent: number
  readonly submit: (event?: string) => void
  readonly choose: (choiceId: string) => void
}

export function useAssautSequence(): UseAssautSequenceResult {
  const [config, setConfig] = useState<AssautSequenceConfig | null>(null)
  const [session, setSession] = useState<AssautSession | null>(null)

  useEffect(() => {
    const bridge = window.assaut
    if (bridge === undefined) return undefined
    let cancelled = false
    bridge
      .getSequenceConfig()
      .then((cfg) => {
        if (cancelled) return
        setConfig(cfg)
        setSession(createSession(cfg))
      })
      .catch((err: unknown) => {
        // eslint-disable-next-line no-console
        console.error('[sequence] getSequenceConfig failed:', err)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Functional updates so the callbacks don't close over `session` (no stale
  // reads, no exhaustive-deps churn) — only `config` is a dependency.
  const submit = useCallback(
    (event?: string) => {
      setSession((prev) => (config !== null && prev !== null ? advance(config, prev, event) : prev))
    },
    [config],
  )

  const choose = useCallback(
    (choiceId: string) => {
      setSession((prev) =>
        config !== null && prev !== null ? applyChoice(config, prev, choiceId) : prev,
      )
    },
    [config],
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
