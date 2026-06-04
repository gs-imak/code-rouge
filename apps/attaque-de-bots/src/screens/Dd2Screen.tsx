import type { JSX } from 'react'
import { Image, StyleSheet, Text } from 'react-native'
import { colors } from '../theme/tokens'
import { EnigmaPanel } from '../components/EnigmaPanel'
import { HudHeader } from '../components/HudHeader'
import { PrimaryButton } from '../components/PrimaryButton'
import { ScreenBackground } from '../components/ScreenBackground'
import { ScreenTitle } from '../components/ScreenTitle'
import disk from '../assets/dd2-disk.png'
import diskOk from '../assets/dd2-disk-ok.png'
import diskErr from '../assets/dd2-disk-err.png'

// « Saisie solution Disques Durs 2 » (maquette 1:1161 / success 40:5931 / error 34:4596):
// pick the 2 blocked spots on the hard-drive platter. The platter is static maquette
// art per state (it carries a drop-shadow, so it is placed at natural size centred on
// its bbox). Success / error tint the panel + add a message + Continuer / Recommancer.
type Dd2State = 'saisie' | 'success' | 'error'

const PANEL: Record<Dd2State, string | undefined> = { saisie: undefined, success: colors.panelSuccess, error: colors.panelError }
const DISK: Record<Dd2State, number> = { saisie: disk, success: diskOk, error: diskErr }

export function Dd2Screen({ state = 'saisie' }: { readonly state?: Dd2State } = {}): JSX.Element {
  return (
    <>
      <ScreenBackground />
      <HudHeader />
      <ScreenTitle>Mémoire des DD</ScreenTitle>
      <EnigmaPanel fill={PANEL[state]} />
      <Text style={styles.instruction}>Sélectionnez les 2 emplacements où l’alimentation semble bloquée</Text>
      <Image source={DISK[state]} style={styles.disk} resizeMode="contain" />
      {state === 'success' ? <Text style={styles.msg}>Félicitation, vous avez trouvé la bonne réponse !</Text> : null}
      {state === 'error' ? <Text style={styles.msg}>Votre solution n’est pas correcte</Text> : null}
      {state === 'saisie' ? <PrimaryButton label="Valider" top={989} /> : null}
      {state === 'success' ? <PrimaryButton label="Continuer" top={1043} /> : null}
      {state === 'error' ? <PrimaryButton label="Recommancer" top={1043} /> : null}
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
