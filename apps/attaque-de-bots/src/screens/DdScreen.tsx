import type { JSX } from 'react'
import { Image, StyleSheet, Text } from 'react-native'
import { colors } from '../theme/tokens'
import { EnigmaPanel } from '../components/EnigmaPanel'
import { HudHeader } from '../components/HudHeader'
import { PrimaryButton } from '../components/PrimaryButton'
import { ScreenBackground } from '../components/ScreenBackground'
import { ScreenTitle } from '../components/ScreenTitle'
import widget from '../assets/dd-widget.png'
import widgetOk from '../assets/dd-widget-ok.png'
import widgetErr from '../assets/dd-widget-err.png'

// « Saisie solution Disques Durs » (maquette 1:1118 / success 40:5753 / error 34:4465):
// drag the 2 correct models into the right-hand zone. The « code_motifs » block
// (instruction + model list + selected zone) is static maquette art per state; success
// / error tint the panel + add a message + Continuer / Recommancer.
type DdState = 'saisie' | 'success' | 'error'

const PANEL: Record<DdState, string | undefined> = { saisie: undefined, success: colors.panelSuccess, error: colors.panelError }
// The exported « code_motifs » PNGs include a drop-shadow, so the rendered image is
// larger than the geometric bbox [264,228 1292×~735]. Place each at its natural design
// size centred on the bbox centre (≈910, 592) so the content lands at the maquette px.
const WIDGET: Record<DdState, { readonly src: number; readonly left: number; readonly top: number; readonly w: number; readonly h: number }> = {
  saisie: { src: widget, left: 247, top: 233, w: 1326, h: 743 },
  success: { src: widgetOk, left: 243, top: 241, w: 1334, h: 743 },
  error: { src: widgetErr, left: 243, top: 241, w: 1334, h: 743 },
}

export function DdScreen({ state = 'saisie' }: { readonly state?: DdState } = {}): JSX.Element {
  const wg = WIDGET[state]
  return (
    <>
      <ScreenBackground />
      <HudHeader />
      <ScreenTitle>Références des DD</ScreenTitle>
      <EnigmaPanel fill={PANEL[state]} />
      <Image source={wg.src} style={{ position: 'absolute', left: wg.left, top: wg.top, width: wg.w, height: wg.h }} resizeMode="contain" />
      {state === 'success' ? <Text style={styles.msg}>Félicitation, vous avez trouvé la bonne réponse !</Text> : null}
      {state === 'error' ? <Text style={styles.msg}>Votre solution n’est pas correcte</Text> : null}
      {state === 'saisie' ? <PrimaryButton label="Valider" top={1004} /> : null}
      {state === 'success' ? <PrimaryButton label="Continuer" top={1023} /> : null}
      {state === 'error' ? <PrimaryButton label="Recommancer" top={1023} /> : null}
    </>
  )
}

const styles = StyleSheet.create({
  // Success / error message (maquette ~[1031,821 607×87] 44px/700 centre, right side).
  msg: {
    position: 'absolute',
    left: 1031,
    top: 821,
    width: 607,
    textAlign: 'center',
    color: colors.white,
    fontFamily: 'Roboto',
    fontSize: 44,
    fontWeight: '700',
    lineHeight: 50,
  },
})
