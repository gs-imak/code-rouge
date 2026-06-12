// Shared interaction-prop contracts for the screens, wired by the screen registry.
// Every callback is OPTIONAL so the dev Gallery can keep rendering each screen
// statically (no handler → inert) while the FlowRunner passes engine-bound
// handlers to make them interactive.

import type { MailboxMail, ParcoursStepKind } from '@code-rouge/shared-types'
import type { SaisieState } from '../components/EnigmeSaisie'

/** Input énigmes (everything with a saisie) — excludes mailbox + piratage. */
export type EnigmeKind = Exclude<ParcoursStepKind, 'mailbox' | 'piratage'>

/** Accueil briefings + simple "advance" screens (accueil/tuto). */
export interface ContinueProps {
  readonly onContinue?: () => void
}

export interface ConnexionScreenProps {
  /** The entered connexion code (parsed to a team id by the app). */
  readonly onSubmit?: (code: string) => void
}

export interface ChoixScreenProps {
  readonly onContinue?: () => void
}

export interface SaisieScreenProps {
  readonly state?: SaisieState
  /** Re-keys the input widget so a Recommencer clears prior taps. */
  readonly attempts?: number
  readonly canRetry?: boolean
  readonly onValidate?: (value: string) => void
  readonly onContinue?: () => void
  readonly onRetry?: () => void
}

export interface MailboxInboxProps {
  readonly mails?: readonly MailboxMail[]
  readonly onOpenMail?: (id: string, phishing: boolean) => void
  readonly onContinue?: () => void
}

export interface MailReadingProps {
  readonly mail?: MailboxMail
  readonly onBack?: () => void
}

export interface TimedProps {
  /** Fired when the interstitial / animation finishes (auto-advance). */
  readonly onDone?: () => void
}

export interface FinScreenProps {
  readonly score?: number
}
