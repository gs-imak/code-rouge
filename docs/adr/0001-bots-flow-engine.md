# Attaque de Bots navigation is a data-driven FSM engine, not React Navigation

**Status:** accepted (M3, 2026-06-05)

## Decision

The Attaque de Bots flow (connexion → accueil → tuto → choix → énigme chain incl.
mailbox/phishing → fin) is driven by a **pure finite-state-machine engine**
(`apps/attaque-de-bots/src/engine/bots-flow.ts`): a single immutable reducer
`dispatch(config, state, event, now)` plus selectors, with no React/RN/IO inside.
The variable middle (the énigme chain) comes from `assets/config/parcours.json`
(A/B/C/D matrix, Zod-validated); per-énigme phase progressions are a data table
(`flow-templates.ts`), never `if (kind === …)` branches. A thin React binding
(`useFlow` + `FlowRunner` + `screen-registry`) renders the current view and
dispatches events; screens stay presentational.

The rich `FlowState` is serialised to its own AsyncStorage key and **projected**
onto the lean cross-app `GameState` (teamId/currentStep/score) for NUC sync —
the same split Assaut uses (`session-bridge.ts`). Exact-screen restore reads the
FlowState blob; the server only ever sees the coarse `currentStep` marker.

## Why (the trade-off)

Considered **React Navigation** (or a screen stack): rejected. The game is a
single linear kiosk flow with no gestures/deep-links/back-stack — a navigator
adds native transition surface we must then suppress, and it does not give us
data-driven ordering, headless-testable navigation, or exact serialise/restore.

The FSM approach satisfies the load-bearing project rules directly: architecture
is data-driven (immutable rule #2 — énigme order/answers/scoring are JSON edits,
no recompile), persistence + exact restore is mandatory (rule #4), and the core
is unit-tested headlessly (25 tests cover every transition, answer validation,
scoring, mailbox trap, and serialisation). It also keeps one mental model across
the two interactive apps: bots mirrors the proven Assaut engine API.

## Consequences

- Adding an énigme = a new `ParcoursStepKind` enum value + a `KIND_TEMPLATES`
  row + its screens. The engine does not change.
- Server-authoritative restore can only reposition to a coarse node id (not an
  in-énigme phase) until a richer restore message exists — acceptable; the local
  FlowState blob is the source of truth for exact restore (chantier 06 concern).
- `GameState` shape is untouched by the wiring (no `reconcile` churn).
