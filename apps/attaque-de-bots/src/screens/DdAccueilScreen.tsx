import type { JSX } from 'react'
import { EnigmeAccueil } from '../components/EnigmeAccueil'
import type { ContinueProps } from '../navigation/types'

// « Accueil Disques Durs » (maquette frame 57:19928): briefing modal — maquette title
// + body are unfilled placeholders (« Message de ?? » / « Texte ? »), reproduced 1:1.
export function DdAccueilScreen({ onContinue }: ContinueProps = {}): JSX.Element {
  return (
    <EnigmeAccueil onContinue={onContinue} title="Message de ??" body="Texte ?" bodyTop={512} okTop={829} />
  )
}
