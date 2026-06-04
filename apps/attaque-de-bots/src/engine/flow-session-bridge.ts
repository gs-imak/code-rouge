// Bridge between the rich flow engine state (FlowState, persisted as its own
// serialised blob) and the lean cross-app GameState the NUC server syncs.
//
// Same split as Assaut (session-bridge.ts): the engine owns navigation +
// scoring; GameState carries only what the server's `team_state` row needs
// (currentStep + score, keyed by teamId/deviceId). The flow session is the
// local source of truth for exact restore; GameState is the wire projection.

import { type GameState, type ParcoursConfig } from '@code-rouge/shared-types'
import { nodeId, type FlowState } from './bots-flow.js'

/**
 * Project the engine state onto a GameState for persistence + server push.
 * `currentStep` is the coarse node id (a progress marker for the GM display);
 * exact in-énigme phase lives only in the serialised flow session.
 */
export function projectToGameState(
  config: ParcoursConfig,
  flow: FlowState,
  base: GameState,
): GameState {
  return {
    ...base,
    currentStep: nodeId(config, flow),
    // Score floor matches StateUpdateMessage's non-negative constraint.
    score: Math.max(0, flow.score),
  }
}
