import type { JSX } from 'react'
import { EnigmeAccueil } from '../components/EnigmeAccueil'
import type { ContinueProps } from '../navigation/types'

// « Accueil Alimentation Serveurs » (maquette frame 57:19856): briefing modal. The
// maquette left the title + body unfilled (« Message de ?? » / « Texte ? »); blanked
// here — default team title, empty body — the real briefing is content (Nathanaël).
export function SrvAccueilScreen({ onContinue }: ContinueProps = {}): JSX.Element {
  return <EnigmeAccueil onContinue={onContinue} body="" okTop={808} />
}
