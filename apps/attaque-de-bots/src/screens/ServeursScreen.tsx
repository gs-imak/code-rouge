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
import toggles from '../assets/srv-toggles.png'
import iconsIdle from '../assets/srv-icons.png'
import iconsOk from '../assets/srv-icons-ok.png'
import iconsErr from '../assets/srv-icons-err.png'

// « Alimentation des serveurs » (maquette frames 1:1029 / 38:5399 / 38:5516): set the
// power toggles to the right ON/OFF combination. The toggles art is the static visual;
// a ToggleGrid overlay makes them switchable, emitting a bit-string (e.g. "1010")
// validated by the engine. success / error keep the maquette panel tints + icon swap +
// message + Continuer / Recommancer. « Recommancer » keeps the maquette spelling.
type SaisieState = NonNullable<SaisieScreenProps['state']>

const PANEL: Record<SaisieState, string | undefined> = { saisie: undefined, success: colors.panelSuccess, error: colors.panelError }
const ICONS: Record<SaisieState, number> = { saisie: iconsIdle, success: iconsOk, error: iconsErr }

export function ServeursScreen({
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
      <ScreenTitle>alimentation des serveurs</ScreenTitle>
      <EnigmaPanel fill={PANEL[state]} />
      <Image source={toggles} style={styles.toggles} resizeMode="contain" />
      <Image source={ICONS[state]} style={styles.icons} resizeMode="contain" />
      {state === 'saisie' ? (
        <ToggleGrid key={attempts} left={479} top={317} width={963} height={409} count={4} onChange={setValue} />
      ) : null}
      {state === 'success' ? <Text style={styles.msg}>Félicitation, vous avez trouvé la bonne combinaison !</Text> : null}
      {state === 'error' ? <Text style={styles.msg}>Votre solution n’est pas correcte</Text> : null}
      {state === 'saisie' ? <PrimaryButton label="Valider" top={979} onPress={() => onValidate?.(value)} /> : null}
      {state === 'success' ? <PrimaryButton label="Continuer" top={999} onPress={onContinue} /> : null}
      {state === 'error' ? (
        <PrimaryButton label={canRetry ? 'Recommancer' : 'Continuer'} top={999} onPress={canRetry ? onRetry : onContinue} />
      ) : null}
    </>
  )
}

const styles = StyleSheet.create({
  // (maquette « Frame 23441 » [479,317 963×409]).
  toggles: { position: 'absolute', left: 479, top: 317, width: 963, height: 409 },
  // (maquette « Frame 23457 » [499,763 911×118]).
  icons: { position: 'absolute', left: 499, top: 763, width: 911, height: 118 },
  // Success / error message (maquette ~[.,925] 44px/700 centre, white) — centred on 960.
  msg: {
    position: 'absolute',
    left: 339,
    top: 915,
    width: 1243,
    textAlign: 'center',
    color: colors.white,
    fontFamily: 'Roboto',
    fontSize: 44,
    fontWeight: '700',
  },
})
