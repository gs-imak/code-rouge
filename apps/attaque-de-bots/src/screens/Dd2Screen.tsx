import { useState, type JSX } from 'react'
import { Image, StyleSheet, Text } from 'react-native'
import { colors } from '../theme/tokens'
import { EnigmaPanel } from '../components/EnigmaPanel'
import { HudHeader } from '../components/HudHeader'
import { PrimaryButton } from '../components/PrimaryButton'
import { ScreenBackground } from '../components/ScreenBackground'
import { ScreenTitle } from '../components/ScreenTitle'
import { ToggleGrid } from '../components/ToggleGrid'
import type { SaisieScreenProps } from '../navigation/types'
import disk from '../assets/dd2-disk.png'
import diskOk from '../assets/dd2-disk-ok.png'
import diskErr from '../assets/dd2-disk-err.png'

// « Saisie solution Disques Durs 2 » (maquette 1:1161 / 40:5931 / 34:4596): pick the
// blocked spots on the platter. The platter art is static per state; a ToggleGrid over
// it makes the spots selectable (bit-string, e.g. "010010"). success / error tint the
// panel + add a message + Continuer / Recommancer.
type SaisieState = NonNullable<SaisieScreenProps['state']>

const PANEL: Record<SaisieState, string | undefined> = { saisie: undefined, success: colors.panelSuccess, error: colors.panelError }
const DISK: Record<SaisieState, number> = { saisie: disk, success: diskOk, error: diskErr }

export function Dd2Screen({
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
      <ScreenTitle>Mémoire des DD</ScreenTitle>
      <EnigmaPanel fill={PANEL[state]} />
      <Text style={styles.instruction}>Sélectionnez les 2 emplacements où l’alimentation semble bloquée</Text>
      <Image source={DISK[state]} style={styles.disk} resizeMode="contain" />
      {state === 'saisie' ? (
        <ToggleGrid key={attempts} left={725} top={347} width={470} height={590} count={6} onChange={setValue} />
      ) : null}
      {state === 'success' ? <Text style={styles.msg}>Félicitation, vous avez trouvé la bonne réponse !</Text> : null}
      {state === 'error' ? <Text style={styles.msg}>Votre solution n’est pas correcte</Text> : null}
      {state === 'saisie' ? <PrimaryButton label="Valider" top={989} onPress={() => onValidate?.(value)} /> : null}
      {state === 'success' ? <PrimaryButton label="Continuer" top={1043} onPress={onContinue} /> : null}
      {state === 'error' ? (
        <PrimaryButton label={canRetry ? 'Recommancer' : 'Continuer'} top={1043} onPress={canRetry ? onRetry : onContinue} />
      ) : null}
    </>
  )
}

const styles = StyleSheet.create({
  // (maquette [453,234 1015×79] 46px/700 centre).
  instruction: { position: 'absolute', left: 453, top: 234, width: 1015, textAlign: 'center', color: colors.white, fontFamily: 'Roboto', fontSize: 46, fontWeight: '700', lineHeight: 79 },
  // Platter (maquette « disque_dure » bbox [744,366 432×552]; natural 470×590 centred).
  disk: { position: 'absolute', left: 725, top: 347, width: 470, height: 590 },
  // Success / error message (maquette ~[.,931] 44px/700 centre, centred on 960).
  msg: { position: 'absolute', left: 316, top: 931, width: 1289, textAlign: 'center', color: colors.white, fontFamily: 'Roboto', fontSize: 44, fontWeight: '700' },
})
