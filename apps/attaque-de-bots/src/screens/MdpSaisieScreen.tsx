import type { JSX } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme/tokens'
import { HudHeader } from '../components/HudHeader'
import { EnigmaPanel } from '../components/EnigmaPanel'
import { PrimaryButton } from '../components/PrimaryButton'
import { ScreenBackground } from '../components/ScreenBackground'
import { ScreenTitle } from '../components/ScreenTitle'
import grid from '../assets/mdp-grid.png'

// « Saisie solution Mot de passe Admin » (maquette frame 1:244): the MDP énigme input.
// The « code_motifs » 3×3 pattern grid (a bespoke widget — rendered 1:1 as a static
// PNG for this visual pass) on the left, the password prompt + field + Valider on the
// right. The field is display-only here; real entry/validation is wired later.
export function MdpSaisieScreen(): JSX.Element {
  return (
    <>
      <ScreenBackground />
      <HudHeader />
      <ScreenTitle>mot de passe admin</ScreenTitle>
      <EnigmaPanel />
      {/* Pattern grid widget (maquette « code_motifs » [325,409 492×492]). */}
      <Image source={grid} style={styles.grid} resizeMode="contain" />
      {/* Prompt (maquette [1005,484 625×79] 36px/700 centre). */}
      <Text style={styles.prompt}>Saisissez le mot de passe admin :</Text>
      {/* Field (maquette « Rectangle 9221 » [1021,582 610×108] white@19% 2px white r20). */}
      <View style={styles.field} />
      <PrimaryButton label="Valider" top={746} left={1151} />
    </>
  )
}

const styles = StyleSheet.create({
  grid: { position: 'absolute', left: 325, top: 409, width: 492, height: 492 },
  prompt: {
    position: 'absolute',
    left: 1005,
    top: 484,
    width: 625,
    textAlign: 'center',
    color: colors.white,
    fontFamily: 'Roboto',
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 79,
  },
  field: {
    position: 'absolute',
    left: 1021,
    top: 582,
    width: 610,
    height: 108,
    backgroundColor: colors.fieldFill,
    borderWidth: 2,
    borderColor: colors.fieldBorder,
    borderRadius: 20,
  },
})
