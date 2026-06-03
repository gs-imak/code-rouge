// Token → CSS custom property adapter for the Electron side.
//
// The Assaut renderer is a fixed Chromium target, so the cheapest theming
// primitive is a `:root { --cr-*: ... }` block that CSS reads via `var()`.
// These vars are DERIVED from the single source of truth in `tokens.ts` — never
// hand-write a hex into renderer CSS, reference the var instead (Senior-Reviewer
// rule #1: DRY). The React-Native apps consume the same `tokens.ts` primitives
// through StyleSheet and do NOT use this file (no CSS engine there).

import { colors, gradients, typography, spacing, radius } from './tokens.js'

/** camelCase / PascalCase → kebab-case (`bgDeep` → `bg-deep`). */
function kebab(key: string): string {
  return key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
}

/**
 * Flatten the design tokens into CSS custom properties under the `--cr-`
 * namespace. Returned as a record so it can be unit-tested headlessly and, if
 * ever needed, spread onto a React `style` prop.
 */
export function tokenCssVars(): Record<string, string> {
  const vars: Record<string, string> = {}

  for (const [name, value] of Object.entries(colors)) {
    vars[`--cr-color-${kebab(name)}`] = value
  }

  vars['--cr-gradient-background'] = gradients.background.css
  vars['--cr-gradient-accent'] = gradients.accent.css

  vars['--cr-font-family'] = typography.fontFamily
  for (const [name, value] of Object.entries(typography.weight)) {
    vars[`--cr-weight-${kebab(name)}`] = String(value)
  }
  for (const [name, value] of Object.entries(typography.size)) {
    vars[`--cr-size-${kebab(name)}`] = `${value}px`
  }

  for (const [name, value] of Object.entries(spacing)) {
    vars[`--cr-space-${kebab(name)}`] = `${value}px`
  }
  for (const [name, value] of Object.entries(radius)) {
    vars[`--cr-radius-${kebab(name)}`] = `${value}px`
  }

  return vars
}

/**
 * Render the tokens as a CSS rule string for injection into a `<style>` tag at
 * renderer boot (see `apps/assaut/src/renderer/src/main.tsx`).
 */
export function tokenCssText(selector = ':root'): string {
  const body = Object.entries(tokenCssVars())
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n')
  return `${selector} {\n${body}\n}\n`
}
