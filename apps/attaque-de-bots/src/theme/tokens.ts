// « Section 13 » — Attaque de Bots (Espace 2) theme. Same brand as Assaut but the
// ORANGE identity from the maquette (Assaut is blue). Values lifted from the Figma
// frames (file k0i1WhiVTUIIt4PRgQWjQa, section App_Attaque_de_Bots). RN consumes
// these directly via StyleSheet. May later promote to @code-rouge/design-system
// as a second theme — kept local while the palette stabilises across screens.

export const colors = {
  /** Button gradient — orange → red-orange (maquette « Buttom » #ff740d → #fb5344). */
  accent: '#FF740D',
  accentDeep: '#FB5344',
  /** Emblem halo (maquette « Ellipse 322 »). */
  halo: '#A23304',
  white: '#FFFFFF',
  /** Dark base — placeholder behind the (raster) background photo. */
  bgDeep: '#0A0D12',
  /** Translucent field fill (maquette input #ffffff @19%). */
  fieldFill: 'rgba(255,255,255,0.19)',
  fieldBorder: 'rgba(255,255,255,0.85)',
} as const

export const typography = {
  // Roboto throughout (maquette). Bundled for the web harness via @font-face;
  // native bundling is a follow-up. RN falls back to system until then.
  fontFamily: 'Roboto',
} as const

/** The design canvas — every screen is authored at these px and scaled to fit. */
export const DESIGN = { width: 1920, height: 1200 } as const
