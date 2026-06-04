import type { JSX } from 'react'
import { Image, StyleSheet } from 'react-native'
import { EnigmeSaisie } from '../components/EnigmeSaisie'
import grid from '../assets/mdp-grid.png'

// « Saisie solution Mot de passe Admin » (maquette frame 1:244): the « code_motifs »
// 3×3 pattern grid (static PNG for the visual pass) on the shared saisie shell.
export function MdpSaisieScreen(): JSX.Element {
  return (
    <EnigmeSaisie title="mot de passe admin" prompt="Saisissez le mot de passe admin :">
      <Image source={grid} style={styles.grid} resizeMode="contain" />
    </EnigmeSaisie>
  )
}

const styles = StyleSheet.create({
  // (maquette « code_motifs » [325,409 492×492]).
  grid: { position: 'absolute', left: 325, top: 409, width: 492, height: 492 },
})
