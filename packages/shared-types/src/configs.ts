import { z } from 'zod'
import { AppName } from './messages.js'

// Game-content schemas. The runtime apps load JSON files matching these
// shapes from `apps/<app>/assets/config/` (or `packages/shared-types/configs/`
// for cross-app config). Schemas are conservative and additive — Nathanael's
// final content for chantier 06 fills `extra: z.record(z.unknown())` bags
// without a code change.
//
// Loading happens at boot; validation failures are fatal (refuse to start
// rather than play with malformed content). The placeholder JSONs in
// `packages/shared-types/configs/` exist solely to keep typecheck + the
// Zod parse path live before final content arrives.

// -------------------------------------------------------------------- Parcours
//
// Attaque de Bots routes each team through one of four variants (A/B/C/D)
// per the cahier des charges. Each variant is an ordered list of énigme
// steps. The `kind` enum is intentionally narrow today and grows additively
// — new énigmes land as new kind values + step components.

export const ParcoursStepKind = z.enum([
  'phishing',
  'mailbox',
  'firewall',
  'patrol',
  'mcgyver',
  'rdv-indic',
  'couper-fil',
  'epilogue',
])
export type ParcoursStepKind = z.infer<typeof ParcoursStepKind>

export const ParcoursStep = z.object({
  id: z.string().min(1).max(64),
  kind: ParcoursStepKind,
  /** Best-guess duration. Used for the GM-facing progress display, not enforced. */
  estimatedDurationSec: z.number().int().positive().max(60 * 60),
  /** Step-specific bag — e.g. mailbox.id for a 'mailbox' step. */
  config: z.record(z.unknown()).default({}),
})
export type ParcoursStep = z.infer<typeof ParcoursStep>

export const ParcoursVariantId = z.enum(['A', 'B', 'C', 'D'])
export type ParcoursVariantId = z.infer<typeof ParcoursVariantId>

export const ParcoursVariant = z.object({
  id: ParcoursVariantId,
  steps: z.array(ParcoursStep).min(1).max(32),
})
export type ParcoursVariant = z.infer<typeof ParcoursVariant>

export const ParcoursConfig = z.object({
  schemaVersion: z.literal(1),
  variants: z.array(ParcoursVariant).min(1).max(4),
})
export type ParcoursConfig = z.infer<typeof ParcoursConfig>

export class ParcoursConfigError extends Error {
  override readonly name = 'ParcoursConfigError'
}

export function parseParcoursConfig(raw: unknown): ParcoursConfig {
  const result = ParcoursConfig.safeParse(raw)
  if (!result.success) {
    throw new ParcoursConfigError(`invalid parcours.json — ${result.error.message}`)
  }
  // Reject duplicate variant IDs — the schema allows up to 4 variants but
  // doesn't constrain uniqueness.
  const ids = new Set<string>()
  for (const v of result.data.variants) {
    if (ids.has(v.id)) {
      throw new ParcoursConfigError(`duplicate parcours variant id: ${v.id}`)
    }
    ids.add(v.id)
  }
  return result.data
}

// -------------------------------------------------------------------- Mailbox
//
// Fake-inbox screen on Attaque de Bots. One mail is piégé (phishing); the
// runtime UI logs the click and feeds it to the score calculation. Mail
// bodies stay French (player-facing); IDs stay ASCII for log searchability.

export const MailboxMail = z.object({
  id: z.string().min(1).max(64).regex(/^[a-z0-9_-]+$/, {
    message: 'mailbox.id: lowercase alphanumeric + dash/underscore only',
  }),
  from: z.string().min(1).max(128),
  subject: z.string().min(1).max(256),
  /** Plain text or markdown — chantier 06 picks the renderer. */
  body: z.string().min(1).max(8192),
  receivedAt: z.string().datetime({ offset: true }),
  /** True = clicking this mail triggers the phishing event. */
  phishing: z.boolean().default(false),
})
export type MailboxMail = z.infer<typeof MailboxMail>

export const MailboxConfig = z.object({
  schemaVersion: z.literal(1),
  mails: z.array(MailboxMail).min(1).max(64),
})
export type MailboxConfig = z.infer<typeof MailboxConfig>

export class MailboxConfigError extends Error {
  override readonly name = 'MailboxConfigError'
}

export function parseMailboxConfig(raw: unknown): MailboxConfig {
  const result = MailboxConfig.safeParse(raw)
  if (!result.success) {
    throw new MailboxConfigError(`invalid mailbox.json — ${result.error.message}`)
  }
  // Exactly one phishing mail today. If chantier 06 needs more, lift this
  // to a `phishingCount` setting on the surrounding config.
  const phishing = result.data.mails.filter((m) => m.phishing)
  if (phishing.length !== 1) {
    throw new MailboxConfigError(
      `mailbox must have exactly 1 phishing mail, got ${phishing.length}`,
    )
  }
  // ID uniqueness — log queries match by id.
  const ids = new Set<string>()
  for (const m of result.data.mails) {
    if (ids.has(m.id)) {
      throw new MailboxConfigError(`duplicate mailbox mail id: ${m.id}`)
    }
    ids.add(m.id)
  }
  return result.data
}

// -------------------------------------------------------------- Assaut sequence
//
// Per `docs/conventions/assaut.md` § Sequence linéaire: 7 ordered steps with
// JSON-described branchements. Today's schema accepts a flat list of
// steps, each with optional `next: stepId` (defaults to the next entry
// in the array) and an optional list of conditional transitions.

export const AssautStepKind = z.enum([
  'debut',
  'perdus',
  'patrouille',
  'perdus2',
  'mcgyver',
  'rdv-indic',
  'couper-fil',
  'epilogue',
])
export type AssautStepKind = z.infer<typeof AssautStepKind>

export const AssautTransition = z.object({
  when: z.string().min(1).max(64), // event/condition name; chantier 06 names them
  goto: z.string().min(1).max(64),
})

export const AssautStep = z.object({
  id: z.string().min(1).max(64),
  kind: AssautStepKind,
  /** Path relative to apps/assaut/assets/media/. Validated to start with `media/`. */
  mediaPath: z.string().regex(/^media\/[a-zA-Z0-9_/.-]+$/, {
    message: 'mediaPath: must start with "media/" and use safe path chars',
  }),
  /** Step transitions; first matching transition wins. */
  transitions: z.array(AssautTransition).default([]),
  /** Step-specific bag — e.g. `{ codeExpected: '4242' }` for a code-entry step. */
  config: z.record(z.unknown()).default({}),
})
export type AssautStep = z.infer<typeof AssautStep>

export const AssautSequenceConfig = z.object({
  schemaVersion: z.literal(1),
  steps: z.array(AssautStep).min(1).max(32),
})
export type AssautSequenceConfig = z.infer<typeof AssautSequenceConfig>

export class AssautSequenceError extends Error {
  override readonly name = 'AssautSequenceError'
}

export function parseAssautSequenceConfig(raw: unknown): AssautSequenceConfig {
  const result = AssautSequenceConfig.safeParse(raw)
  if (!result.success) {
    throw new AssautSequenceError(`invalid assaut sequence — ${result.error.message}`)
  }
  // Reject duplicates; assert every transition.goto resolves to a real step.
  const ids = new Set<string>()
  for (const s of result.data.steps) {
    if (ids.has(s.id)) {
      throw new AssautSequenceError(`duplicate assaut step id: ${s.id}`)
    }
    ids.add(s.id)
  }
  for (const s of result.data.steps) {
    for (const t of s.transitions) {
      if (!ids.has(t.goto)) {
        throw new AssautSequenceError(
          `assaut step "${s.id}" transition.goto "${t.goto}" does not resolve`,
        )
      }
    }
  }
  return result.data
}

// -------------------------------------------------------------- Game variant
//
// `standard | short | long | custom` per architecture.md §7. Selected by
// the GM at game start; the apps load the matching parcours/mailbox/assaut
// configs by reference.

export const GameVariantId = z.enum(['standard', 'short', 'long', 'custom'])
export type GameVariantId = z.infer<typeof GameVariantId>

export const GameVariantConfig = z.object({
  schemaVersion: z.literal(1),
  id: GameVariantId,
  totalDurationSec: z.number().int().positive().max(4 * 60 * 60), // ≤ 4 h
  teamCount: z.number().int().positive().max(12),
  /** Which apps this variant uses. Allows future "audio-only" or "Assaut-skipped" variants. */
  apps: z.array(AppName).min(1),
  /** Reference into parcours.variants[].id — the parcours the GM picks for E2. */
  parcoursVariant: ParcoursVariantId,
})
export type GameVariantConfig = z.infer<typeof GameVariantConfig>

export class GameVariantError extends Error {
  override readonly name = 'GameVariantError'
}

export function parseGameVariantConfig(raw: unknown): GameVariantConfig {
  const result = GameVariantConfig.safeParse(raw)
  if (!result.success) {
    throw new GameVariantError(`invalid game variant — ${result.error.message}`)
  }
  return result.data
}
