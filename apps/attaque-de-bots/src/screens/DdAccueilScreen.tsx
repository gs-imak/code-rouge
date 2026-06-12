import type { JSX } from 'react'
import { EnigmeAccueil } from '../components/EnigmeAccueil'
import type { ContinueProps } from '../navigation/types'

// « Accueil Disques Durs » (maquette frame 57:19928, filled by Laura 2026-06-11):
// « ALERTE : PURGE DES DISQUES DURS » is the modal title strip and the body is three
// plain centred lines in a widened box [460,495 1000] — her layout drops the bullets
// from Nathanaël's 06-08 comment. « références : [à venir] » is verbatim maquette —
// the real refs (his 05-15 comment on 1:14) still await her widget update before
// they can land here + in parcours.json. « donnez nous » stays shipped corrected to
// « donnez-nous » (flagged, same policy as the maquette typos).
export function DdAccueilScreen({ onContinue }: ContinueProps = {}): JSX.Element {
  return (
    <EnigmeAccueil
      onContinue={onContinue}
      title="Alerte : purge des disques durs"
      body={
        'Suppression des données en cours par un BOT du Réseau.\n' +
        'Trouvez les 2 disques durs déployés sur les postes (références : [à venir]).\n' +
        'Trouvez et donnez-nous les références de ces 2 disques durs parmi la liste ' +
        'ci-dessous pour que nous puissions stopper l’attaque.'
      }
      bodyTop={495}
      bodyLeft={460}
      bodyWidth={1000}
      okTop={829}
    />
  )
}
