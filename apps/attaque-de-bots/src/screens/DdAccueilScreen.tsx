import type { JSX } from 'react'
import { EnigmeAccueil } from '../components/EnigmeAccueil'

// « Accueil Disques Durs » (maquette frame 57:19928): briefing modal — maquette title
// + body are unfilled placeholders (« Message de ?? » / « Texte ? »), reproduced 1:1.
export function DdAccueilScreen(): JSX.Element {
  return <EnigmeAccueil title="Message de ??" body="Texte ?" bodyTop={512} okTop={829} />
}
