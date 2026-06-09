import type { JSX } from 'react'
import { EnigmeAccueil } from '../components/EnigmeAccueil'
import type { ContinueProps } from '../navigation/types'

// « Accueil Alimentation Serveurs » (maquette frame 57:19856): briefing modal.
// Body = Nathanaël's content (Figma comment, 2026-06-08). His text opened with a
// « MESSAGE DE L'ÉQUIPE TECHNIQUE » heading — dropped here because the modal's
// title strip already says « Message de l'équipe de la section 13 » (flagged).
export function SrvAccueilScreen({ onContinue }: ContinueProps = {}): JSX.Element {
  return (
    <EnigmeAccueil
      onContinue={onContinue}
      body={
        'Le serveur informatique a été coupé par un BOT du Réseau. Trouvez l’information vous ' +
        'permettant de brancher l’alimentation de secours à l’arrière du serveur. Paramétrez ' +
        'ensuite l’alimentation avec cette tablette.'
      }
      okTop={808}
    />
  )
}
