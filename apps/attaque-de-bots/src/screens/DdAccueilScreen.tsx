import type { JSX } from 'react'
import { EnigmeAccueil } from '../components/EnigmeAccueil'
import type { ContinueProps } from '../navigation/types'

// « Accueil Disques Durs » (maquette frame 57:19928): briefing modal. Body =
// Nathanaël's content (Figma comment, 2026-06-08), verbatim incl. his
// « références : [à venir] » placeholder — the real refs exist in his 05-15
// comment on 1:14 (ZKL-O / WW-LO correct, shuffled) but await Laura's widget
// update before they can land here + in parcours.json. « donnez nous » shipped
// corrected to « donnez-nous » (flagged, same policy as the maquette typos).
export function DdAccueilScreen({ onContinue }: ContinueProps = {}): JSX.Element {
  return (
    <EnigmeAccueil
      onContinue={onContinue}
      body={
        'ALERTE : PURGE DES DISQUES DURS\n' +
        'Suppression des données en cours par un BOT du Réseau.\n' +
        '• Trouvez les 2 disques durs déployés sur les postes (références : [à venir]).\n' +
        '• Trouvez et donnez-nous les références de ces 2 disques durs parmi la liste ' +
        'ci-dessous pour que nous puissions stopper l’attaque.'
      }
      // Body raised from the 512 default: 7-8 rendered lines would otherwise
      // run into the OK button at 829 (the maquette frame's body was empty —
      // no reference layout for this text length; flagged to Laura).
      bodyTop={400}
      okTop={829}
    />
  )
}
