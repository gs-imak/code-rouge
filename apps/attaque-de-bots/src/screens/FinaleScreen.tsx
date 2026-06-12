import { useState, type JSX } from 'react'
import { Image, StyleSheet, Text, TextInput } from 'react-native'
import { colors } from '../theme/tokens'
import { EnigmaPanel } from '../components/EnigmaPanel'
import { HudHeader } from '../components/HudHeader'
import { PrimaryButton } from '../components/PrimaryButton'
import { ScreenBackground } from '../components/ScreenBackground'
import { ScreenTitle } from '../components/ScreenTitle'
import type { SaisieScreenProps } from '../navigation/types'
import leftPanel from '../assets/fin-left.png'
import rightPanel from '../assets/fin-right.png'

// « Saisie Énigme Finale » (maquette 1:1306 / 34:4720 / 34:4945): find the symbols
// (left panel) and key the final code (right panel). Both panels are static maquette
// art. The maquette result states carry NO CTA, so a typed entry field + Valider (and
// the Continuer/Recommencer for the wired flow) are runner-only additions placed below
// the panels — flagged for the graphiste's interactive finale design.
type SaisieState = NonNullable<SaisieScreenProps['state']>

const PANEL: Record<SaisieState, string | undefined> = { saisie: undefined, success: colors.panelSuccess, error: colors.panelError }

export function FinaleScreen({
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
      <ScreenTitle>attaque de bot xc65</ScreenTitle>
      <EnigmaPanel fill={PANEL[state]} />
      <Image source={leftPanel} style={styles.left} resizeMode="contain" />
      <Image source={rightPanel} style={styles.right} resizeMode="contain" />
      {state === 'saisie' ? (
        <>
          <TextInput
            key={attempts}
            style={[styles.field, styles.fieldText]}
            value={value}
            onChangeText={setValue}
            autoCapitalize="characters"
            autoCorrect={false}
            onSubmitEditing={() => onValidate?.(value)}
            accessibilityLabel="Code final"
          />
          <PrimaryButton label="Valider" top={1040} left={1300} width={260} onPress={() => onValidate?.(value)} />
        </>
      ) : null}
      {state === 'success' ? <Text style={[styles.msg, { top: 928 }]}>Félicitation,  vous avez trouvé le bon code !</Text> : null}
      {state === 'error' ? <Text style={[styles.msg, { top: 973 }]}>Le code est incorrecte</Text> : null}
      {state === 'success' ? (
        <PrimaryButton label="Continuer" top={1040} left={1300} width={260} onPress={onContinue} />
      ) : null}
      {state === 'error' ? (
        <PrimaryButton label={canRetry ? 'Recommencer' : 'Continuer'} top={1040} left={1300} width={260} onPress={canRetry ? onRetry : onContinue} />
      ) : null}
    </>
  )
}

const styles = StyleSheet.create({
  // Left "symbols" panel (maquette bbox [237,446 680×418]; natural 748×486 centred).
  left: { position: 'absolute', left: 203, top: 412, width: 748, height: 486 },
  // Right "keypad + code" panel (maquette bbox [1017,200 665×909]; natural 733×977 centred).
  right: { position: 'absolute', left: 983, top: 166, width: 733, height: 977 },
  // Runner-only entry field below the panels (placeholder layout).
  field: { position: 'absolute', left: 640, top: 1040, width: 620, height: 84, backgroundColor: colors.fieldFill, borderWidth: 2, borderColor: colors.fieldBorder, borderRadius: 20 },
  fieldText: { textAlign: 'center', color: colors.white, fontFamily: 'Roboto', fontSize: 38, fontWeight: '700' },
  // Success / error message (maquette [163,~928 827×88] 44px/700 centre, left column).
  msg: { position: 'absolute', left: 163, width: 827, textAlign: 'center', color: colors.white, fontFamily: 'Roboto', fontSize: 44, fontWeight: '700', lineHeight: 50 },
})
