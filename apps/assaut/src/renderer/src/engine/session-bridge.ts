// Adapter between the pure Assaut engine session and the persisted/synced
// GameState (shared-types). Kept separate from the engine so the engine stays
// GameState-agnostic (Senior rule #3: orchestration vs storage at the boundary).
//
// NOTE — restore fidelity: GameState persists only `currentStep` + `score`
// (the fields the NUC sync needs). A resumed session is therefore positioned
// at the persisted step with the persisted score, but its `choices`/`visited`
// history starts empty — same fidelity as M1's persistence. Full-session
// persistence (choices/visited surviving a force-kill) is a follow-up that
// adds a dedicated electron-store key + IPC channel.

import type { AssautSequenceConfig, GameState } from '@code-rouge/shared-types'
import { clampPercent, createSession, hasStep, phaseOf, type AssautSession } from './assaut-sequence'

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
