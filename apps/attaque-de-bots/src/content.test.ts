import { describe, it, expect } from 'vitest'
import { MAILBOX, PARCOURS, PHISHING_MAIL_ID } from './content.js'

// The shipped content is loaded + validated at import. These assertions guard
// the bundled JSON the same way shared-types guards its placeholders: a bad
// edit breaks CI immediately, not on game day.
describe('shipped game content', () => {
  it('parcours has all four A/B/C/D variants', () => {
    expect(PARCOURS.variants.map((v) => v.id).sort()).toEqual(['A', 'B', 'C', 'D'])
  })

  it('every variant ends on a finale then piratage', () => {
    for (const v of PARCOURS.variants) {
      const kinds = v.steps.map((s) => s.kind)
      expect(kinds).toContain('finale')
      expect(kinds.at(-1)).toBe('piratage')
    }
  })

  it('exposes exactly one phishing mail id', () => {
    expect(MAILBOX.mails.filter((m) => m.phishing)).toHaveLength(1)
    expect(MAILBOX.mails.some((m) => m.id === PHISHING_MAIL_ID && m.phishing)).toBe(true)
  })
})
