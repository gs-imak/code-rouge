// Small inline-SVG icons used on the prep panels. Kept inline (not Figma vector
// exports) because they're simple geometric glyphs — the radar/target reticle at
// the top of the « Bonjour opérateur » panels, and the success/failure markers.

export interface IconProps {
  readonly size?: number
}

/** Chunky right arrow — the « Arrow right-big » glyph inside the prep-hub action
    circles (maquette 42×42). Colour follows `currentColor`. */
export function ArrowRightIcon({ size = 42 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 42 42" fill="none" aria-hidden="true">
      <path
        d="M7 21h25M23 10.5 33.5 21 23 31.5"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** « broadcast » signal mark (exact maquette vector, node 29:3432) — top of the
    « Bonjour opérateur » prompt panels: two open arcs + a centre dot. */
export function RadarIcon({ size = 78 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 78 78" fill="none" aria-hidden="true">
      <g stroke="#59B7FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M59.6833 62.9321C63.7739 58.8414 66.5597 53.6295 67.6883 47.9556C68.8169 42.2817 68.2376 36.4005 66.0237 31.0558C63.8099 25.711 60.0608 21.1428 55.2507 17.9288C50.4405 14.7148 44.7854 12.9993 39.0003 12.9993C33.2152 12.9993 27.56 14.7148 22.7498 17.9288C17.9397 21.1428 14.1907 25.711 11.9768 31.0558C9.76291 36.4005 9.18364 42.2817 10.3122 47.9556C11.4408 53.6295 14.2266 58.8414 18.3172 62.9321" />
        <path d="M50.4925 53.741C52.7647 51.4683 54.312 48.5728 54.9386 45.4207C55.5653 42.2686 55.2432 39.0015 54.0132 36.0325C52.7831 33.0634 50.7003 30.5258 48.0281 28.7404C45.3559 26.955 42.2143 26.002 39.0005 26.002C35.7868 26.002 32.6452 26.955 29.9729 28.7404C27.3007 30.5258 25.2179 33.0634 23.9879 36.0325C22.7578 39.0015 22.4358 42.2686 23.0624 45.4207C23.6891 48.5728 25.2363 51.4683 27.5085 53.741" />
        <path d="M35.7508 42.2494C35.7508 43.1113 36.0932 43.938 36.7027 44.5475C37.3122 45.157 38.1388 45.4994 39.0008 45.4994C39.8627 45.4994 40.6894 45.157 41.2989 44.5475C41.9084 43.938 42.2508 43.1113 42.2508 42.2494C42.2508 41.3874 41.9084 40.5608 41.2989 39.9513C40.6894 39.3418 39.8627 38.9994 39.0008 38.9994C38.1388 38.9994 37.3122 39.3418 36.7027 39.9513C36.0932 40.5608 35.7508 41.3874 35.7508 42.2494Z" />
      </g>
    </svg>
  )
}

/** Green success marker (« Félicitations opérateurs ! »). */
export function CheckIcon({ size = 64 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="32" cy="32" r="29" fill="#2ecf7c" />
      <circle cx="32" cy="32" r="31" stroke="#2ecf7c" strokeWidth="2" opacity="0.4" />
      <path
        d="M19 33.5l8.5 8.5L45 23"
        stroke="#fff"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Red failure marker (« Échec »). */
export function CrossIcon({ size = 64 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="32" cy="32" r="29" fill="#e0454b" />
      <circle cx="32" cy="32" r="31" stroke="#e0454b" strokeWidth="2" opacity="0.4" />
      <path
        d="M22 22l20 20M42 22L22 42"
        stroke="#fff"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  )
}
