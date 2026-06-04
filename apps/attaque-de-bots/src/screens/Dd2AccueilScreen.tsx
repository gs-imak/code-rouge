import type { JSX } from 'react'
import { EnigmeAccueil } from '../components/EnigmeAccueil'

// « Accueil Disques Durs 2 » (maquette frame 57:20002): alert briefing. « réfusé »
// keeps the maquette spelling (flagged for the graphiste).
export function Dd2AccueilScreen(): JSX.Element {
  return (
    <EnigmeAccueil
      title="Message d’alerte"
      body="Accès à la mémoire des disques durs réfusé faute d’alimentation électrique.  Identifier l’endroit où le courant est coupé sur les 2 disques durs. Outil de détection nécessaire, à se procurer sur place."
      bodyTop={512}
      okTop={816}
    />
  )
}
