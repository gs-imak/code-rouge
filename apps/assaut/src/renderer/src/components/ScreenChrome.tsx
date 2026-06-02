import type { ReactNode } from 'react'
import bgUrl from '../assets/section13-bg.svg'
import './ScreenChrome.css'

// Shared « Section 13 » chrome for every Assaut screen. The tactical background
// (radial navy + topographic contours + HUD corner brackets + ruler + waveform)
// is the maquette's `BG` component, exported header-less as one vector SVG
// (Figma `Layer_1`, node 56:7453) and bundled locally — no runtime fetch
// (immutable rule #3). The header is a real overlay (SectionHeader) so its
// dynamic variants (live score + timer on the assault screens) stay real DOM.

export interface ScreenChromeProps {
  /** The top bar — typically a <SectionHeader>. Optional for chrome-only frames. */
  readonly header?: ReactNode
  /** Screen body, rendered above the background and below the header. */
  readonly children: ReactNode
}

export function ScreenChrome({ header, children }: ScreenChromeProps): JSX.Element {
  return (
    <main className="screen">
      <img className="screen__bg" src={bgUrl} alt="" aria-hidden="true" />
      {header}
      <div className="screen__body">{children}</div>
    </main>
  )
}
