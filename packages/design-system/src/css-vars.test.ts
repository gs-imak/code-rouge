import { describe, expect, it } from 'vitest'
import { colors, gradients, typography } from './tokens.js'
import { tokenCssVars, tokenCssText } from './css-vars.js'

describe('tokenCssVars', () => {
  it('emits every color primitive under the kebab-cased --cr-color- namespace', () => {
    const vars = tokenCssVars()
    expect(vars['--cr-color-accent']).toBe(colors.accent)
    expect(vars['--cr-color-bg-deep']).toBe(colors.bgDeep)
    expect(vars['--cr-color-text-on-accent']).toBe(colors.textOnAccent)
  })

  it('exposes the ready-to-use gradient CSS strings', () => {
    const vars = tokenCssVars()
    expect(vars['--cr-gradient-background']).toBe(gradients.background.css)
    expect(vars['--cr-gradient-accent']).toBe(gradients.accent.css)
  })

  it('px-suffixes the numeric type, spacing and radius scales', () => {
    const vars = tokenCssVars()
    expect(vars['--cr-size-prompt']).toBe(`${typography.size.prompt}px`)
    expect(vars['--cr-space-md']).toBe('16px')
    expect(vars['--cr-radius-pill']).toBe('999px')
  })

  it('keeps font weights unitless', () => {
    expect(tokenCssVars()['--cr-weight-bold']).toBe('700')
  })
})

describe('tokenCssText', () => {
  it('wraps the variables in the requested selector', () => {
    const css = tokenCssText(':root')
    expect(css.startsWith(':root {\n')).toBe(true)
    expect(css.trimEnd().endsWith('}')).toBe(true)
    expect(css).toContain(`--cr-color-accent: ${colors.accent};`)
  })

  it('defaults the selector to :root', () => {
    expect(tokenCssText()).toBe(tokenCssText(':root'))
  })
})
