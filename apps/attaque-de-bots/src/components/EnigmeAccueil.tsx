import type { JSX } from 'react'
import { HudHeader } from './HudHeader'
import { EnigmaPanel } from './EnigmaPanel'
import { MessageModal } from './MessageModal'
import { ScreenBackground } from './ScreenBackground'

// Shared shell for every énigme's « accueil » (the briefing): the section-13 message
// modal over the énigme panel. Per-énigme screens supply the title/body and (when the
// briefing is longer) the body + OK vertical offsets. Briefing copy is the maquette
// placeholder; it becomes config content at wiring time.
export function EnigmeAccueil({
  title,
  body,
  bodyTop,
  bodyLeft,
  bodyWidth,
  okTop,
  onContinue,
}: {
  readonly title?: string
  readonly body: string
  readonly bodyTop?: number
  readonly bodyLeft?: number
  readonly bodyWidth?: number
  readonly okTop?: number
  /** Dismiss the briefing → the énigme's saisie phase. Absent in the dev Gallery. */
  readonly onContinue?: () => void
}): JSX.Element {
  return (
    <>
      <ScreenBackground />
      <HudHeader />
      <EnigmaPanel />
      <MessageModal
        title={title}
        body={body}
        bodyTop={bodyTop}
        bodyLeft={bodyLeft}
        bodyWidth={bodyWidth}
        okTop={okTop}
        onOk={onContinue}
      />
    </>
  )
}
