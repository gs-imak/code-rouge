import type { JSX } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme/tokens'
import { EnigmaPanel } from '../components/EnigmaPanel'
import { HudHeader } from '../components/HudHeader'
import { PrimaryButton } from '../components/PrimaryButton'
import { ScreenBackground } from '../components/ScreenBackground'
import { ScreenTitle } from '../components/ScreenTitle'
import keypad from '../assets/lec-keypad.png'

// « Saisie Lecteur carte » (maquette 1:1221 / success 41:6663 / error 41:6558): enter the
// access code on the keypad. saisie shows the prompt + field + Valider on the right;
// success / error tint the panel and replace the right column with a message +
// Continuer / Recommancer. The keypad is static maquette art (shadow → placed at
// natural size centred on its bbox).
type LecState = 'saisie' | 'success' | 'error'

const PANEL: Record<LecState, string | undefined> = { saisie: undefined, success: colors.panelSuccess, error: colors.panelError }

export function LecScreen({ state = 'saisie' }: { readonly state?: LecState } = {}): JSX.Element {
  return (
    <>
      <ScreenBackground />
      <HudHeader />
      <ScreenTitle>Accès aux serveurs coupé</ScreenTitle>
      <EnigmaPanel fill={PANEL[state]} />
      <Image source={keypad} style={styles.keypad} resizeMode="contain" />
      {state === 'saisie' ? (
        <>
          <Text style={styles.prompt}>Saisissez le code d’accès :</Text>
          <View style={styles.field} />
          <PrimaryButton label="Valider" top={746} left={1151} />
        </>
      ) : null}
      {state === 'success' ? (
        <>
          <Text style={styles.msg}>Félicitation,  vous avez trouvé le bon code !</Text>
          <PrimaryButton label="Continuer" top={764} left={1147} />
        </>
      ) : null}
      {state === 'error' ? (
        <>
          <Text style={styles.msg}>Le code est incorrecte</Text>
          <PrimaryButton label="Recommancer" top={764} left={1147} />
        </>
      ) : null}
    </>
  )
}

const styles = StyleSheet.create({
  // Keypad (maquette « cadran_chiffres » bbox [335,335 480×640]; natural 548×708 centred).
  keypad: { position: 'absolute', left: 301, top: 301, width: 548, height: 708 },
  // (maquette « Frame 23438 » [1005,484 625×79] 36px/700 centre).
  prompt: { position: 'absolute', left: 1005, top: 484, width: 625, textAlign: 'center', color: colors.white, fontFamily: 'Roboto', fontSize: 36, fontWeight: '700', lineHeight: 79 },
  field: { position: 'absolute', left: 1021, top: 582, width: 610, height: 108, backgroundColor: colors.fieldFill, borderWidth: 2, borderColor: colors.fieldBorder, borderRadius: 20 },
  // Success / error message (maquette [906,345 827×88] 44px/700 centre, right column).
  msg: { position: 'absolute', left: 906, top: 345, width: 827, textAlign: 'center', color: colors.white, fontFamily: 'Roboto', fontSize: 44, fontWeight: '700', lineHeight: 50 },
})
