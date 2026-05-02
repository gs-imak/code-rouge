import { describe, it, expect } from 'vitest'
import {
  ParcoursConfig,
  parseParcoursConfig,
  ParcoursConfigError,
  MailboxConfig,
  parseMailboxConfig,
  MailboxConfigError,
  AssautSequenceConfig,
  parseAssautSequenceConfig,
  AssautSequenceError,
  GameVariantConfig,
  parseGameVariantConfig,
  GameVariantError,
} from './configs.js'

import parcoursPlaceholder from '../configs/parcours.placeholder.json' with { type: 'json' }
import mailboxPlaceholder from '../configs/mailbox.placeholder.json' with { type: 'json' }
import assautPlaceholder from '../configs/assaut.placeholder.json' with { type: 'json' }
import gameStandardPlaceholder from '../configs/game.standard.placeholder.json' with {
  type: 'json',
}

// The placeholder JSONs are committed precisely so a typo in `configs.ts`
// (or a regression in the parser) breaks CI immediately rather than
// surfacing on the day the graphiste/Nathanael drop their content.
describe('placeholder JSONs all parse', () => {
  it('parcours.placeholder parses', () => {
    expect(() => parseParcoursConfig(parcoursPlaceholder)).not.toThrow()
  })
  it('mailbox.placeholder parses', () => {
    expect(() => parseMailboxConfig(mailboxPlaceholder)).not.toThrow()
  })
  it('assaut.placeholder parses', () => {
    expect(() => parseAssautSequenceConfig(assautPlaceholder)).not.toThrow()
  })
  it('game.standard.placeholder parses', () => {
    expect(() => parseGameVariantConfig(gameStandardPlaceholder)).not.toThrow()
  })
})

describe('parseParcoursConfig — negative paths', () => {
  it('rejects an empty variants list', () => {
    expect(() =>
      parseParcoursConfig({ schemaVersion: 1, variants: [] }),
    ).toThrowError(ParcoursConfigError)
  })

  it('rejects duplicate variant IDs', () => {
    expect(() =>
      parseParcoursConfig({
        schemaVersion: 1,
        variants: [
          { id: 'A', steps: [{ id: 's1', kind: 'phishing', estimatedDurationSec: 60 }] },
          { id: 'A', steps: [{ id: 's1', kind: 'phishing', estimatedDurationSec: 60 }] },
        ],
      }),
    ).toThrowError(/duplicate parcours variant id/)
  })

  it('rejects an unknown step kind', () => {
    expect(() =>
      parseParcoursConfig({
        schemaVersion: 1,
        variants: [
          {
            id: 'A',
            steps: [{ id: 's1', kind: 'not-a-real-kind', estimatedDurationSec: 60 }],
          },
        ],
      }),
    ).toThrowError(ParcoursConfigError)
  })

  it('applies the empty default config bag', () => {
    const result = parseParcoursConfig({
      schemaVersion: 1,
      variants: [
        { id: 'A', steps: [{ id: 's1', kind: 'phishing', estimatedDurationSec: 60 }] },
      ],
    })
    expect(result.variants[0]!.steps[0]!.config).toEqual({})
  })
})

describe('parseMailboxConfig — negative paths', () => {
  const baseMail = {
    from: 'a@b.local',
    subject: 'subj',
    body: 'body',
    receivedAt: '2026-04-29T08:00:00+02:00',
  }

  it('rejects zero phishing mails', () => {
    expect(() =>
      parseMailboxConfig({
        schemaVersion: 1,
        mails: [{ id: 'm1', ...baseMail, phishing: false }],
      }),
    ).toThrowError(/phishing mail/)
  })

  it('rejects two phishing mails', () => {
    expect(() =>
      parseMailboxConfig({
        schemaVersion: 1,
        mails: [
          { id: 'm1', ...baseMail, phishing: true },
          { id: 'm2', ...baseMail, phishing: true },
        ],
      }),
    ).toThrowError(/phishing mail/)
  })

  it('rejects duplicate mail IDs', () => {
    expect(() =>
      parseMailboxConfig({
        schemaVersion: 1,
        mails: [
          { id: 'm1', ...baseMail, phishing: true },
          { id: 'm1', ...baseMail, phishing: false },
        ],
      }),
    ).toThrowError(/duplicate mailbox mail id/)
  })

  it('rejects ID with uppercase / spaces (regex enforcement)', () => {
    expect(() =>
      parseMailboxConfig({
        schemaVersion: 1,
        mails: [{ id: 'Bad ID', ...baseMail, phishing: true }],
      }),
    ).toThrowError(MailboxConfigError)
  })

  it('rejects a non-ISO receivedAt', () => {
    expect(() =>
      parseMailboxConfig({
        schemaVersion: 1,
        mails: [
          { id: 'm1', ...baseMail, receivedAt: 'yesterday', phishing: true },
        ],
      }),
    ).toThrowError(MailboxConfigError)
  })
})

describe('parseAssautSequenceConfig — negative paths', () => {
  const baseStep = {
    kind: 'debut' as const,
    mediaPath: 'media/x.mp4',
  }

  it('rejects mediaPath that escapes the media/ prefix', () => {
    expect(() =>
      parseAssautSequenceConfig({
        schemaVersion: 1,
        steps: [{ id: 's1', ...baseStep, mediaPath: '../../etc/passwd' }],
      }),
    ).toThrowError(AssautSequenceError)
  })

  it('rejects a transition.goto that does not resolve to any step', () => {
    expect(() =>
      parseAssautSequenceConfig({
        schemaVersion: 1,
        steps: [
          {
            id: 's1',
            ...baseStep,
            transitions: [{ when: 'cond', goto: 'no-such-step' }],
          },
        ],
      }),
    ).toThrowError(/transition\.goto/)
  })

  it('rejects duplicate step ids', () => {
    expect(() =>
      parseAssautSequenceConfig({
        schemaVersion: 1,
        steps: [
          { id: 's1', ...baseStep },
          { id: 's1', ...baseStep },
        ],
      }),
    ).toThrowError(/duplicate assaut step id/)
  })
})

describe('parseGameVariantConfig — negative paths', () => {
  const baseVariant = {
    schemaVersion: 1 as const,
    id: 'standard' as const,
    totalDurationSec: 3600,
    teamCount: 12,
    apps: ['attaque-de-bots'] as const,
    parcoursVariant: 'A' as const,
  }

  it('rejects teamCount > 12', () => {
    expect(() =>
      parseGameVariantConfig({ ...baseVariant, teamCount: 13 }),
    ).toThrowError(GameVariantError)
  })

  it('rejects unknown variant id', () => {
    expect(() =>
      parseGameVariantConfig({ ...baseVariant, id: 'xtreme' }),
    ).toThrowError(GameVariantError)
  })

  it('rejects empty apps list', () => {
    expect(() =>
      parseGameVariantConfig({ ...baseVariant, apps: [] }),
    ).toThrowError(GameVariantError)
  })
})

// Schema sanity — guard against a future hand edit that would break
// downstream consumers reading these types.
describe('schema sanity', () => {
  it('ParcoursConfig.parse({}) fails (schemaVersion + variants required)', () => {
    expect(ParcoursConfig.safeParse({}).success).toBe(false)
  })
  it('MailboxConfig.parse({}) fails', () => {
    expect(MailboxConfig.safeParse({}).success).toBe(false)
  })
  it('AssautSequenceConfig.parse({}) fails', () => {
    expect(AssautSequenceConfig.safeParse({}).success).toBe(false)
  })
  it('GameVariantConfig.parse({}) fails', () => {
    expect(GameVariantConfig.safeParse({}).success).toBe(false)
  })
})
