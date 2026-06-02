// Small inline-SVG icons used on the prep panels. Kept inline (not Figma vector
// exports) because they're simple geometric glyphs — the radar/target reticle at
// the top of the « Bonjour opérateur » panels, and the success/failure markers.

export interface IconProps {
  readonly size?: number
}

/** Target / radar reticle — top of the « Bonjour opérateur » prompt panels. */
export function RadarIcon({ size = 56 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <circle cx="28" cy="28" r="26" stroke="#59B7FF" strokeWidth="1.4" opacity="0.45" />
      <circle cx="28" cy="28" r="17.5" stroke="#59B7FF" strokeWidth="1.4" opacity="0.7" />
      <circle cx="28" cy="28" r="9" stroke="#59B7FF" strokeWidth="1.6" />
      <circle cx="28" cy="28" r="3" fill="#59B7FF" />
      <path
        d="M28 1.5v8M28 46.5v8M1.5 28h8M46.5 28h8"
        stroke="#59B7FF"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
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
