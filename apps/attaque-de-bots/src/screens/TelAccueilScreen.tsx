import type { JSX } from 'react'
import { EnigmeAccueil } from '../components/EnigmeAccueil'
import type { ContinueProps } from '../navigation/types'

// « Accueil Téléphone » (maquette frame 1:399): the téléphonie énigme briefing. The
// message is from « l'équipe technique » and is longer, so the body + OK sit lower.
export function TelAccueilScreen({ onContinue }: ContinueProps = {}): JSX.Element {
  return (
    <EnigmeAccueil
      onContinue={onContinue}
      title="Message de l’équipe technique"
      bodyTop={502}
      okTop={792}
      body="Le système de téléphonie de l’entreprise est attaqué. Faites le point de votre côté et envoyez-nous de quoi débugger tout ça. Apparemment, nous avons besoin de 5 chiffres pour le poste téléphonique X."
    />
  )
}
