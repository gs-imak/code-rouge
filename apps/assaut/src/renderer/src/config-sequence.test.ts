import { describe, expect, it } from 'vitest'
import { parseAssautSequenceConfig } from '@code-rouge/shared-types'
import sequence from '../../../assets/config/sequence.json' with { type: 'json' }

// Guard: the committed placeholder Assaut config must always satisfy the
// schema. A typo here (or a regression in the parser) breaks CI immediately
// rather than at boot on the venue PC. Mirrors the shared-types
// placeholder-parses guard.
describe('assets/config/sequence.json', () => {
  it('parses against AssautSequenceConfig', () => {
    expect(() => parseAssautSequenceConfig(sequence)).not.toThrow()
  })

  it('models the preparation phase before the assault steps', () => {
    const config = parseAssautSequenceConfig(sequence)
    expect(config.prep.length).toBeGreaterThan(0)
    expect(config.prep[0]!.kind).toBe('saisie-acces')
    expect(config.steps[0]!.kind).toBe('debut')
  })
})
