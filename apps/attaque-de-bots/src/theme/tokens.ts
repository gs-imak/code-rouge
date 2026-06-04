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
  /** Dark base — letterbox behind the scaled canvas. */
  bgDeep: '#0A0D12',
  /** Full-frame background photo placeholder (maquette « image 7 ») — neutral dark
   *  reddish stand-in until the graphiste delivers the real raster (rule #3). */
  bgPlaceholder: '#1B1113',
  /** Translucent field fill (maquette input #ffffff @19%). */
  fieldFill: 'rgba(255,255,255,0.19)',
  fieldBorder: 'rgba(255,255,255,0.85)',
  /** Tutorial scrim — full-screen dim over the énigme behind the callouts (#000 @50%). */
  scrim: 'rgba(0,0,0,0.5)',
  /** Énigme content panel (maquette « Rectangle 9220 » #000 @30%). */
  panelDim: 'rgba(0,0,0,0.3)',
  /** Énigme panel success / error tints (maquette #25d58d / #ff3f3f @30%). */
  panelSuccess: 'rgba(37,213,141,0.3)',
  panelError: 'rgba(255,63,63,0.3)',
  /** Choix card panel (maquette « Rectangle 9220/9222 » #000 @20%). */
  panelCard: 'rgba(0,0,0,0.2)',
  /** Panel / card hairline border (maquette stroke #ffffff @50%). */
  panelStroke: 'rgba(255,255,255,0.5)',
  /** HUD bottom divider (maquette « Line 23 » #ffffff @30%). */
  divider: 'rgba(255,255,255,0.3)',
  /** HUD timer box fill (maquette « Rectangle 9226 » #ffffff @17%). */
  timerBox: 'rgba(255,255,255,0.17)',
  /** Score gauge track / fill (maquette « Jauge » — gradients approximated solid). */
  jaugeTrack: '#FD6537',
  jaugeFill: '#FFAC53',
  /** Énigme card image placeholder (licensed raster not bundled — rule #3). */
  imagePlaceholder: '#2A2A30',
  /** Gmail-mimic mailbox card (maquette « Boite Mails » / « Mails »). */
  mailPanel: '#F7F8FC',
  mailContent: '#FFFFFF',
  mailRowUnread: '#F2F5FC',
  mailText: '#333333',
  mailTextMuted: '#6D6E70',
  mailDate: '#414244',
  mailDivider: '#E0E0E0',
  mailHeading: '#64686C',
  mailCheck: '#333333',
  mailCheckMuted: '#BDBDBD',
  /** Fin score box (maquette « Rectangle 9232 » #fd6537 @27% r40) + layered score. */
  scoreBox: 'rgba(253,101,55,0.27)',
  scoreShadow: '#FF7937',
  /** Admin status dots (maquette « Ellipse 302-307 »): lit vs unlit. */
  dotOn: '#FD6820',
  dotOnStroke: '#FFF3EB',
  dotOff: 'rgba(255,255,255,0.3)',
  /** Admin dropdown field (maquette #ffffff @16% stroke #ffffff r15). */
  dropdownFill: 'rgba(255,255,255,0.16)',
  /** Admin « Transmettre » dark button (maquette gradient #000→#4f4f4f, solid approx). */
  darkButton: '#3A3A3A',
  /** BDD red alert modal (maquette gradient #a21616→#3c0808) + its red OK button. */
  alertModal: '#7A1212',
  alertButton: '#E80101',
} as const

export const typography = {
  // Roboto throughout (maquette). Bundled for the web harness via @font-face;
  // native bundling is a follow-up. RN falls back to system until then.
  fontFamily: 'Roboto',
} as const

/** The design canvas — every screen is authored at these px and scaled to fit. */
export const DESIGN = { width: 1920, height: 1200 } as const
