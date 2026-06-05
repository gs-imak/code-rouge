import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { AssautSequenceConfig, GameState } from '@code-rouge/shared-types'
import {
  advance,
  applyChoice,
  currentStep,
  serializeSession,
  type AssautPhase,
  type AssautSession,
} from './engine/assaut-sequence'
import { initialSession } from './engine/session-bridge'

// React glue over the pure Assaut engine (engine/assaut-sequence.ts is headless +
// unit-tested; per Senior-Reviewer rule #3 the hook holds no business logic). The
// flow config loads over the `GetSequenceConfig` IPC channel. On boot the hook now
// resumes the EXACT session (choices + visit history) from the persisted blob
// (`getSession`), falling back to the GameState step+score reposition; every
// transition re-persists the blob (`setSession`) and projects to GameState via
// `onCommit` (for NUC sync + the cross-app restore). Without the Electron bridge
// (browser harness / dev gallery) the hook stays dormant and the host renders the
// entry screen.

export interface UseAssautSequenceOptions {
  /** Gate the boot until the persisted GameState is loaded (no restore-from-defaults race). */
  readonly ready: boolean
  /** Persisted GameState — the step+score fallback when no full-session blob exists. */
  readonly initialGameState: GameState
  /** Fires after every committed session change, for GameState projection + NUC push. */
  readonly onCommit?: (session: AssautSession) => void
}

export interface UseAssautSequenceResult {
  readonly ready: boolean
  readonly phase: AssautPhase | null
  readonly step: ReturnType<typeof currentStep>
  readonly dataRecoveredPercent: number
  readonly submit: (event?: string) => void
  readonly choose: (choiceId: string) => void
}

export function useAssautSequence(options: UseAssautSequenceOptions): UseAssautSequenceResult {
  const [config, setConfig] = useState<AssautSequenceConfig | null>(null)
  const [session, setSession] = useState<AssautSession | null>(null)
  // Refs mirror the latest config/session so the action callbacks read fresh
  // values without re-creating each transition, and so the persist/project side
  // effects run OUTSIDE the setState updater (which must stay pure).
  const configRef = useRef<AssautSequenceConfig | null>(null)
  const sessionRef = useRef<AssautSession | null>(null)
  const gameStateRef = useRef<GameState>(options.initialGameState)
  gameStateRef.current = options.initialGameState
  const onCommitRef = useRef(options.onCommit)
  onCommitRef.current = options.onCommit

  // Boot once, after the persisted GameState is ready. Loads the flow config + the
  // full-session blob and resumes the exact session (initialSession).
  useEffect(() => {
    if (!options.ready || configRef.current !== null) return undefined
    const bridge = window.assaut
    if (bridge === undefined) return undefined
    let cancelled = false
    Promise.all([bridge.getSequenceConfig(), bridge.getSession().catch(() => null)])
      .then(([cfg, blob]) => {
        if (cancelled) return
        const restored = initialSession(cfg, blob, gameStateRef.current)
        configRef.current = cfg
        sessionRef.current = restored
        setConfig(cfg)
        setSession(restored)
      })
      .catch((err: unknown) => {
        // eslint-disable-next-line no-console
        console.error('[sequence] boot failed:', err)
      })
    return () => {
      cancelled = true
    }
  }, [options.ready])

  // Commit a transition: update state + ref, persist the full-session blob, and
  // project to GameState via onCommit. One path for both advance and choose.
  const commit = useCallback((next: AssautSession) => {
    sessionRef.current = next
    setSession(next)
    window.assaut?.setSession(serializeSession(next)).catch((err: unknown) => {
      // eslint-disable-next-line no-console
      console.error('[sequence] setSession failed:', err)
    })
    onCommitRef.current?.(next)
  }, [])

  const submit = useCallback(
    (event?: string) => {
      const cfg = configRef.current
      const prev = sessionRef.current
      if (cfg === null || prev === null) return
      commit(advance(cfg, prev, event))
    },
    [commit],
  )

  const choose = useCallback(
    (choiceId: string) => {
      const cfg = configRef.current
      const prev = sessionRef.current
      if (cfg === null || prev === null) return
      commit(applyChoice(cfg, prev, choiceId))
    },
    [commit],
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
