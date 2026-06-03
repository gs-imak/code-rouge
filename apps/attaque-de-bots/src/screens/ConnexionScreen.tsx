import type { JSX } from 'react'
import { Image, StyleSheet, Text, TextInput, View } from 'react-native'
import { colors } from '../theme/tokens'
import logo from '../assets/section13-logo-orange.png'

// « Connexion » (maquette frame 1:60). Children absolutely positioned at exact
// maquette px inside the 1920×1200 ScaledCanvas. The background is a raster photo
// in the maquette — placeholder until the graphiste delivers it (immutable rule
// #3). The orange « Buttom » gradient is approximated by a solid accent for now;
// a gradient lib lands when polishing.
export function ConnexionScreen(): JSX.Element {
  return (
    <>
      <View style={styles.bg} />
      <View style={styles.halo} />
      <Image source={logo} style={styles.logo} resizeMode="contain" />
      <Text style={styles.label}>Saisissez votre code de connexion :</Text>
      <TextInput style={styles.input} />
      <View style={styles.button}>
        <Text style={styles.buttonText}>Valider</Text>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  // Background photo placeholder — dark reddish (maquette « image 7 »).
  bg: { position: 'absolute', left: 0, top: 0, width: 1920, height: 1200, backgroundColor: '#1b1113' },
  // Emblem halo (maquette « Ellipse 322 » 390×390 @ [765,97]).
  halo: {
    position: 'absolute',
    left: 765,
    top: 97,
    width: 390,
    height: 390,
    borderRadius: 195,
    backgroundColor: colors.halo,
    opacity: 0.5,
  },
  // SECTION13 orange logo (maquette « logo » [800,112 320×455]).
  logo: { position: 'absolute', left: 800, top: 112, width: 320, height: 455 },
  // Prompt (maquette [547,660 826×115] 36px/700 centre).
  label: {
    position: 'absolute',
    left: 547,
    top: 678,
    width: 826,
    textAlign: 'center',
    color: colors.white,
    fontFamily: 'Roboto',
    fontSize: 36,
    fontWeight: '700',
  },
  // Field (maquette [655,774 610×108] white@19% 2px white r20).
  input: {
    position: 'absolute',
    left: 655,
    top: 774,
    width: 610,
    height: 108,
    backgroundColor: colors.fieldFill,
    borderWidth: 2,
    borderColor: colors.fieldBorder,
    borderRadius: 20,
    color: colors.white,
    fontFamily: 'Roboto',
    fontSize: 30,
    textAlign: 'center',
  },
  // « Valider » (maquette « Buttom » [794,959 337×80] orange, label 34px/700).
  button: {
    position: 'absolute',
    left: 794,
    top: 959,
    width: 337,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: colors.white, fontFamily: 'Roboto', fontSize: 34, fontWeight: '700' },
})
