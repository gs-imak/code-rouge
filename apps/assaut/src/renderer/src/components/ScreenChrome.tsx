import type { ReactNode } from 'react'
import photoUrl from '../assets/bg-photo.jpg'
import bgUrl from '../assets/section13-bg.svg'
import './ScreenChrome.css'

// Shared « Section 13 » chrome for every Assaut screen. Two background layers,
// both maquette-exact: a full-frame photo (the maquette's `istockphoto-…` fill,
// exported from Figma) under the tactical vector overlay (radial navy +
// topographic contours + HUD brackets + ruler + waveform — Figma `Layer_1`,
// node 56:7453). Both bundled locally, no runtime fetch (immutable rule #3).
// REVIEW-BUILD NOTE: the photo is a licensed iStock comp — swap for a licensed/
// owned raster before any shipped build. The header is a real overlay
// (SectionHeader) so its dynamic variants (live score + timer) stay real DOM.

export interface ScreenChromeProps {
  /** The top bar — typically a <SectionHeader>. Optional for chrome-only frames. */
  readonly header?: ReactNode
  /** Screen body, rendered above the background and below the header. */
  readonly children: ReactNode
}

export function ScreenChrome({ header, children }: ScreenChromeProps): JSX.Element {
  return (
    <main className="screen">
      <img className="screen__photo" src={photoUrl} alt="" aria-hidden="true" />
      <img className="screen__bg" src={bgUrl} alt="" aria-hidden="true" />
      {header}
      <div className="screen__body">{children}</div>
    </main>
  )
}
