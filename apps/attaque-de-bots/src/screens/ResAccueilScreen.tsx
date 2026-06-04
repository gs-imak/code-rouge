import type { JSX } from 'react'
import { EnigmeAccueil } from '../components/EnigmeAccueil'

// « Accueil Réseau internet » (maquette frame 1:437): briefing modal on the énigme
// shell. NOTE: the maquette body copy still refers to « le système de téléphonie »
// (a leftover from the Téléphone énigme) — reproduced 1:1 and flagged for the
// graphiste. Title is « l'équipe technique » here (not « la section 13 »).
export function ResAccueilScreen(): JSX.Element {
  return (
    <EnigmeAccueil
      title="Message de l’équipe technique"
      body="Le système de téléphonie de l’entreprise est attaqué. Faites le point de votre côté et envoyez-nous de quoi débugger tout ça. Apparemment, nous avons besoin de 5 chiffres pour le poste téléphonique X."
      bodyTop={511}
      okTop={815}
    />
  )
}
