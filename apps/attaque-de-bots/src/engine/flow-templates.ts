// Per-kind phase templates for the Attaque de Bots flow engine.
//
// Each énigme `kind` declares HOW it progresses internally — its machine
// archetype and (for input énigmes) the intro phases shown before the
// « saisie » answer screen. This is DATA, not branching logic: the engine
// drives any kind generically off this table, so adding an énigme is a new
// table row + its screens, never an `if (kind === …)` in the engine
// (immutable rule #2: architecture is data-driven).
//
// Three archetypes:
//   - 'enigme' : accueil (→ loading) → saisie → success | error → retry
//   - 'mailbox': inbox → reading | phishing  (the fake-inbox trap)
//   - 'single' : one screen, then continue (piratage unlock)

import type { ParcoursStepKind } from '@code-rouge/shared-types'

/** Every screen the inner phase machine can sit on. */
export type Phase =
  | 'single' // single-screen kinds + prologue/epilogue nodes
  | 'accueil' // énigme briefing modal
  | 'loading' // interstitial (bdd « chargement des bases »)
  | 'saisie' // answer entry
  | 'success' // correct answer
  | 'error' // wrong answer
  | 'inbox' // mailbox: the mail list
  | 'reading' // mailbox: a legit mail open
  | 'phishing' // mailbox: the piégé mail was opened (trap fired)

export type MachineKind = 'enigme' | 'mailbox' | 'single'

export interface KindTemplate {
  readonly machine: MachineKind
  /** Phases shown before « saisie », in order. Only meaningful for 'enigme'. */
  readonly intro: readonly Phase[]
}

// Exhaustive map: a missing or extra kind is a compile error, so the enum and
// the templates can never silently drift apart.
export const KIND_TEMPLATES: Record<ParcoursStepKind, KindTemplate> = {
  mailbox: { machine: 'mailbox', intro: [] },
  mdp: { machine: 'enigme', intro: ['accueil'] },
  telephone: { machine: 'enigme', intro: ['accueil'] },
  reseau: { machine: 'enigme', intro: ['accueil'] },
  serveurs: { machine: 'enigme', intro: ['accueil'] },
  'disques-durs': { machine: 'enigme', intro: ['accueil'] },
  'disques-durs-2': { machine: 'enigme', intro: ['accueil'] },
  bdd: { machine: 'enigme', intro: ['accueil', 'loading'] },
  'lecteur-carte': { machine: 'enigme', intro: ['accueil'] },
  finale: { machine: 'enigme', intro: ['accueil'] },
  piratage: { machine: 'single', intro: [] },
}

/** The phase an énigme step opens on when first entered. */
export function initialPhase(kind: ParcoursStepKind): Phase {
  const template = KIND_TEMPLATES[kind]
  switch (template.machine) {
    case 'mailbox':
      return 'inbox'
    case 'single':
      return 'single'
    case 'enigme':
      return template.intro[0] ?? 'saisie'
  }
}

/**
 * The next intro phase after `phase` for an énigme, or 'saisie' once the
 * intro list is exhausted. e.g. bdd: accueil → loading → saisie.
 */
export function nextIntroPhase(kind: ParcoursStepKind, phase: Phase): Phase {
  const { intro } = KIND_TEMPLATES[kind]
  const idx = intro.indexOf(phase)
  if (idx === -1 || idx === intro.length - 1) return 'saisie'
  return intro[idx + 1] ?? 'saisie'
}
