import { useState, type JSX } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme/tokens'
import { EnigmaPanel } from '../components/EnigmaPanel'
import { HudHeader } from '../components/HudHeader'
import { PrimaryButton } from '../components/PrimaryButton'
import { ScreenBackground } from '../components/ScreenBackground'
import { ScreenTitle } from '../components/ScreenTitle'
import { TapGrid } from '../components/TapGrid'
import type { SaisieScreenProps } from '../navigation/types'
import keypad from '../assets/lec-keypad.png'

// « Saisie Lecteur carte » (maquette 1:1221 / 41:6663 / 41:6558): key the access code
// on the keypad. The keypad art is the static visual; a TapGrid overlay turns it into
// real digit entry, shown in the field and validated by the engine. success / error
// tint the panel + replace the right column with a message + Continuer / Recommencer.
type SaisieState = NonNullable<SaisieScreenProps['state']>

const PANEL: Record<SaisieState, string | undefined> = { saisie: undefined, success: colors.panelSuccess, error: colors.panelError }

export function LecScreen({
  state = 'saisie',
  attempts = 0,
  canRetry = true,
  onValidate,
  onContinue,
  onRetry,
}: SaisieScreenProps = {}): JSX.Element {
  const [value, setValue] = useState('')
  return (
    <>
      <ScreenBackground />
      <HudHeader />
      <ScreenTitle>Accès aux serveurs coupé</ScreenTitle>
      <EnigmaPanel fill={PANEL[state]} />
      <Image source={keypad} style={styles.keypad} resizeMode="contain" />
      {state === 'saisie' ? (
        <>
          <TapGrid
            key={attempts}
            left={335}
            top={360}
            width={480}
            height={620}
            rows={4}
            cols={3}
            tokens={['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '']}
            separator=""
            feedback="none"
            onChange={setValue}
          />
          <Text style={styles.prompt}>Saisissez le code d’accès :</Text>
          <View style={styles.field}>
            <Text style={styles.fieldText}>{value}</Text>
          </View>
          <PrimaryButton label="Valider" top={746} left={1151} onPress={() => onValidate?.(value)} />
        </>
      ) : null}
      {state === 'success' ? (
        <>
          <Text style={styles.msg}>Félicitation,  vous avez trouvé le bon code !</Text>
          <PrimaryButton label="Continuer" top={764} left={1147} onPress={onContinue} />
        </>
      ) : null}
      {state === 'error' ? (
        <>
          <Text style={styles.msg}>Le code est incorrecte</Text>
          <PrimaryButton label={canRetry ? 'Recommencer' : 'Continuer'} top={764} left={1147} onPress={canRetry ? onRetry : onContinue} />
        </>
      ) : null}
    </>
  )
}

const styles = StyleSheet.create({
  // Keypad (maquette « cadran_chiffres » bbox [335,335 480×640]; natural 548×708 centred).
  keypad: { position: 'absolute', left: 301, top: 301, width: 548, height: 708 },
  // (maquette « Frame 23438 » [1005,484 625×79] 36px/700 centre, textCase UPPER —
  // single line, lineHeight = box height centres it like Figma vCenter).
  prompt: { position: 'absolute', left: 1005, top: 484, width: 625, textAlign: 'center', textTransform: 'uppercase', color: colors.white, fontFamily: 'Roboto', fontSize: 36, fontWeight: '700', lineHeight: 79 },
  field: { position: 'absolute', left: 1021, top: 582, width: 610, height: 108, backgroundColor: colors.fieldFill, borderWidth: 2, borderColor: colors.fieldBorder, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  fieldText: { width: '100%', textAlign: 'center', color: colors.white, fontFamily: 'Roboto', fontSize: 40, fontWeight: '700' },
  // Success / error message (maquette [906,345 827×88] 44px/700 centre, right column).
  msg: { position: 'absolute', left: 906, top: 345, width: 827, textAlign: 'center', color: colors.white, fontFamily: 'Roboto', fontSize: 44, fontWeight: '700', lineHeight: 50 },
})
