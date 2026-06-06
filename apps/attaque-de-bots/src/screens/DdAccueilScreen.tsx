import type { JSX } from 'react'
import { EnigmeAccueil } from '../components/EnigmeAccueil'
import type { ContinueProps } from '../navigation/types'

// « Accueil Disques Durs » (maquette frame 57:19928): briefing modal. The maquette
// left the title + body unfilled (« Message de ?? » / « Texte ? »); blanked here —
// default team title, empty body — the real briefing is content (Nathanaël).
export function DdAccueilScreen({ onContinue }: ContinueProps = {}): JSX.Element {
  return <EnigmeAccueil onContinue={onContinue} body="" okTop={829} />
}
