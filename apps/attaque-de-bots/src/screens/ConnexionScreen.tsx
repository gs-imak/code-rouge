import { useState, type JSX } from 'react'
import { Image, StyleSheet, Text, TextInput, View } from 'react-native'
import { colors } from '../theme/tokens'
import { PrimaryButton } from '../components/PrimaryButton'
import { ScreenBackground } from '../components/ScreenBackground'
import type { ConnexionScreenProps } from '../navigation/types'
import logo from '../assets/section13-logo-orange.png'

// « Connexion » (maquette frame 1:60). Children absolutely positioned at exact
// maquette px inside the 1920×1200 ScaledCanvas. The background is a raster photo
// in the maquette — placeholder until the graphiste delivers it (immutable rule #3).
export function ConnexionScreen({ onSubmit }: ConnexionScreenProps = {}): JSX.Element {
  const [code, setCode] = useState('')
  return (
    <>
      <ScreenBackground />
      <View style={styles.halo} />
      <Image source={logo} style={styles.logo} resizeMode="contain" />
      <Text style={styles.label}>Saisissez votre code de connexion :</Text>
      <TextInput
        style={styles.input}
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        onSubmitEditing={() => onSubmit?.(code)}
        accessibilityLabel="Code de connexion"
      />
      <PrimaryButton label="Valider" top={959} onPress={() => onSubmit?.(code)} />
    </>
  )
}

const styles = StyleSheet.create({
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
})
