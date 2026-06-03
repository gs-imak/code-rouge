// « Section 13 » design tokens — the shared source of truth for Code Rouge.
//
// Extracted from the Figma maquettes (file k0i1WhiVTUIIt4PRgQWjQa, section
// `App_Assaut`). That file publishes NO shared styles/variables, so these are
// lifted from frame node properties via the REST API. Colors + type below are
// exact from the maquette; spacing/radius are a sensible scale (the file has no
// token system to read them from) and get refined per-screen against the
// reference renders.
//
// One object, two adapters: the Electron renderer (Assaut) consumes these as
// CSS custom properties; the React-Native apps consume the same primitives via
// StyleSheet. Never redefine a token inside an app — import from here.

/** Raw color primitives (exact, from the maquette). */
export const colors = {
  // Electric blues — accents, borders, glows
  accent: '#1C99FF',
  accentCyan: '#00FFFF',
  accentBlue: '#0CB1F2',
  accentLight: '#59B7FF',
  // Deep navy — backgrounds + shadows
  bgDeep: '#080D1A',
  bgNavy: '#020E53',
  bgTeal: '#1C3F54',
  indigo: '#2B2E7F',
  // Neutrals
  white: '#FFFFFF',
  /** Dark text sitting on a bright accent surface (e.g. the Valider button). */
  textOnAccent: '#020E53',
} as const

/** Gradient stops (exact) + ready-to-use CSS strings for the Electron side. */
export const gradients = {
  /** Tactical page background. */
  background: {
    stops: ['#1C3F54', '#080D1A'] as const,
    css: 'radial-gradient(circle at 50% 40%, #1C3F54 0%, #080D1A 100%)',
  },
  /** Primary button / panel edge. */
  accent: {
    stops: ['#66C5F0', '#2B2E7F'] as const,
    css: 'linear-gradient(180deg, #66C5F0 0%, #2B2E7F 100%)',
  },
} as const

/** Typography — Roboto throughout, sizes in px from the maquette. */
export const typography = {
  fontFamily: "'Roboto', system-ui, -apple-system, sans-serif",
  weight: { regular: 400, semibold: 600, bold: 700 },
  /** Role-based sizes (px) read off the connexion + gameplay frames. */
  size: { header: 20, prompt: 28, button: 26, body: 16 },
} as const

/** Spacing scale (px) — provisional 4/8 base; refine per screen. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const

/** Corner radii (px) — provisional; the panels use generous rounding. */
export const radius = {
  sm: 6,
  md: 12,
  pill: 999,
} as const

export type Colors = typeof colors
export type Gradients = typeof gradients
export type Typography = typeof typography
