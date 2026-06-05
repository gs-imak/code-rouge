// Adapter between the pure Assaut engine session and the persisted/synced
// GameState (shared-types). Kept separate from the engine so the engine stays
// GameState-agnostic (Senior rule #3: orchestration vs storage at the boundary).
//
// Restore order (see initialSession):
//   1. The full serialized session blob (choices + visit history) — EXACT resume.
//   2. Fallback: GameState's `currentStep` + `score` only — best-effort, used when
//      no blob exists yet (fresh install, or a state persisted before blob support).
// GameState still carries currentStep+score for the NUC sync + cross-app restore;
// the blob is the renderer-local source of truth for exact resume (ADR-0001).

import type { AssautSequenceConfig, GameState } from '@code-rouge/shared-types'
import {
  clampPercent,
  createSession,
  deserializeSession,
  hasStep,
  phaseOf,
  type AssautSession,
} from './assaut-sequence'

/**
 * Pick the session to resume on cold boot. Prefers the full persisted blob
 * (exact choices/visited); falls back to the GameState-based reposition when the
 * blob is absent or no longer fits the current config (e.g. a config edit orphaned
 * a persisted step). Never throws — a corrupt blob degrades to the fallback.
 */
export function initialSession(
  config: AssautSequenceConfig,
  blob: string | null,
  gameState: GameState,
): AssautSession {
  if (blob !== null) {
    try {
      const session = deserializeSession(blob)
      // Trust the blob only if its active step still exists in the config; a
      // completed session (currentStepId === null) is always safe to restore.
      if (session.currentStepId === null || hasStep(config, session.currentStepId)) {
        return session
      }
    } catch {
      // Corrupt / version-skewed blob — fall through to the GameState restore.
    }
  }
  return restoreSession(config, gameState)
}

/** Rebuild a session from persisted GameState, best-effort, on cold boot. */
export function restoreSession(
  config: AssautSequenceConfig,
  gameState: GameState,
): AssautSession {
  if (!hasStep(config, gameState.currentStep)) {
    // Fresh install or a step id that no longer exists in the config.
    return createSession(config)
  }
  return {
    phase: phaseOf(config, gameState.currentStep),
    currentStepId: gameState.currentStep,
    choices: {},
    dataRecoveredPercent: clampPercent(gameState.score),
    visited: [gameState.currentStep],
  }
}

/** Project the live session onto GameState for persistence + NUC sync. */
export function projectToGameState(session: AssautSession, prev: GameState): GameState {
  const currentStep =
    session.currentStepId ?? session.visited[session.visited.length - 1] ?? prev.currentStep
  return { ...prev, currentStep, score: session.dataRecoveredPercent }
}
