// Game-content loader. The bundled JSON under assets/config/ is parsed +
// validated through the shared Zod schemas at module load (boot). Validation
// is FATAL by design (immutable rule #2 + configs.ts contract): a malformed
// content edit must crash the app at startup rather than play half-broken
// content mid-session. Metro bundles the JSON into the APK; the web harness
// (vite) resolves it the same way.

import {
  parseMailboxConfig,
  parseParcoursConfig,
  type MailboxConfig,
  type ParcoursConfig,
} from '@code-rouge/shared-types'
import parcoursRaw from '../assets/config/parcours.json'
import mailboxRaw from '../assets/config/mailbox.json'

export const PARCOURS: ParcoursConfig = parseParcoursConfig(parcoursRaw)
export const MAILBOX: MailboxConfig = parseMailboxConfig(mailboxRaw)

/** The single piégé mail, resolved once (the schema guarantees exactly one). */
export const PHISHING_MAIL_ID: string =
  MAILBOX.mails.find((m) => m.phishing)?.id ?? MAILBOX.mails[0]!.id
