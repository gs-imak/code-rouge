import './HudBrackets.css'

// Four cyan HUD corner brackets, framing a positioned (relative) parent — the
// recurring tactical frame on media areas and Admin panels. Decorative.

export function HudBrackets(): JSX.Element {
  return (
    <>
      <span className="hud-bracket hud-bracket--tl" />
      <span className="hud-bracket hud-bracket--tr" />
      <span className="hud-bracket hud-bracket--bl" />
      <span className="hud-bracket hud-bracket--br" />
    </>
  )
}
