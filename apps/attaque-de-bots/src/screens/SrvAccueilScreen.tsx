import type { JSX } from 'react'
import { EnigmeAccueil } from '../components/EnigmeAccueil'
import type { ContinueProps } from '../navigation/types'

// « Accueil Alimentation Serveurs » (maquette frame 57:19856, filled by Laura
// 2026-06-11): the modal title strip reads « MESSAGE DE L'ÉQUIPE TECHNIQUE » (not
// the shared default « … de la section 13 ») and the body is Nathanaël's 06-08
// content, which she typed into the frame unchanged.
export function SrvAccueilScreen({ onContinue }: ContinueProps = {}): JSX.Element {
  return (
    <EnigmeAccueil
      onContinue={onContinue}
      title="Message de l’équipe technique"
      body={
        'Le serveur informatique a été coupé par un BOT du Réseau. Trouvez l’information vous ' +
        'permettant de brancher l’alimentation de secours à l’arrière du serveur. Paramétrez ' +
        'ensuite l’alimentation avec cette tablette.'
      }
      okTop={808}
    />
  )
}
