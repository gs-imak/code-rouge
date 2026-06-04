import type { JSX } from 'react'
import { EnigmeAccueil } from '../components/EnigmeAccueil'

// « Accueil Alimentation Serveurs » (maquette frame 57:19856): briefing modal. The
// maquette title + body are unfilled placeholders (« Message de ?? » / « Texte ? »)
// — reproduced 1:1; the real copy lands as config content.
export function SrvAccueilScreen(): JSX.Element {
  return <EnigmeAccueil title="Message de ??" body="Texte ?" bodyTop={512} okTop={808} />
}
