import type { JSX } from 'react'
import { EnigmeAccueil } from '../components/EnigmeAccueil'
import type { ContinueProps } from '../navigation/types'

// « Accueil Mot de passe Admin » (maquette frame 1:361): the MDP énigme briefing.
export function MdpAccueilScreen({ onContinue }: ContinueProps = {}): JSX.Element {
  return (
    <EnigmeAccueil
      onContinue={onContinue}
      body="Nous avons besoin du mot de passe ADMIN du post IT de l’entreprise pour arrêter une des attaques de BOT. Fouillez le bureau IT pour retrouver ce mot de passe."
    />
  )
}
