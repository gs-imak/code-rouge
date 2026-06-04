import type { JSX } from 'react'
import { EnigmeAccueil } from '../components/EnigmeAccueil'
import type { ContinueProps } from '../navigation/types'

// « Accueil Lecteur carte » (maquette frame 57:20077): briefing modal.
export function LecAccueilScreen({ onContinue }: ContinueProps = {}): JSX.Element {
  return (
    <EnigmeAccueil
      onContinue={onContinue}
      title="Message de l'équipe technique de Section 13"
      body="Accès aux serveurs par l’équipe technique impossible. Insérer les cartes d’autorisation d’accès dans le lecteur. Le voyant vert valide l’accès.  Les 5 cartes doivent être validées."
      bodyTop={512}
      okTop={802}
    />
  )
}
