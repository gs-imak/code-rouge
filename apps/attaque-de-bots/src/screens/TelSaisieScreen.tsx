import type { JSX } from 'react'
import { Image, StyleSheet } from 'react-native'
import { EnigmeSaisie } from '../components/EnigmeSaisie'
import cadran from '../assets/tel-cadran.png'

// « Saisie solution Téléphone » (maquette frame 1:273): the « cadran_chiffres » phone
// keypad (static PNG for the visual pass) on the shared saisie shell. NOTE: the
// maquette title still reads « mot de passe admin » (leftover from the MDP screen) —
// reproduced 1:1 and flagged for the graphiste; the prompt is the real one.
export function TelSaisieScreen(): JSX.Element {
  return (
    <EnigmeSaisie title="mot de passe admin" prompt="Saisissez le code de débuggage :">
      <Image source={cadran} style={styles.cadran} resizeMode="contain" />
    </EnigmeSaisie>
  )
}

const styles = StyleSheet.create({
  // (maquette « cadran_chiffres » [331,335 480×640]).
  cadran: { position: 'absolute', left: 331, top: 335, width: 480, height: 640 },
})
