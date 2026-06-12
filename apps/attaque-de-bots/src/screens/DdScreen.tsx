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
import widget from '../assets/dd-widget.png'
import widgetOk from '../assets/dd-widget-ok.png'
import widgetErr from '../assets/dd-widget-err.png'

// « Saisie solution Disques Durs » (maquette 1:1118 / success 40:5753 / error 34:4465):
// pick the correct disk models. The « code_motifs » block is static maquette art per
// state; a ToggleGrid overlay makes the model row selectable (bit-string, e.g. "0110").
// success / error tint the panel + add a message + Continuer / Recommencer.
type SaisieState = NonNullable<SaisieScreenProps['state']>

const PANEL: Record<SaisieState, string | undefined> = { saisie: undefined, success: colors.panelSuccess, error: colors.panelError }
// The exported « code_motifs » PNGs include a drop-shadow, so the rendered image is
// larger than the geometric bbox. Place each at its natural design size centred on the
// bbox centre so the content lands at the maquette px.
const WIDGET: Record<SaisieState, { readonly src: number; readonly left: number; readonly top: number; readonly w: number; readonly h: number }> = {
  saisie: { src: widget, left: 247, top: 233, w: 1326, h: 743 },
  success: { src: widgetOk, left: 243, top: 241, w: 1334, h: 743 },
  error: { src: widgetErr, left: 243, top: 241, w: 1334, h: 743 },
}

export function DdScreen({
  state = 'saisie',
  attempts = 0,
  canRetry = true,
  onValidate,
  onContinue,
  onRetry,
}: SaisieScreenProps = {}): JSX.Element {
  const [value, setValue] = useState('')
  const wg = WIDGET[state]
  return (
    <>
      <ScreenBackground />
      <HudHeader />
      <ScreenTitle>Références des DD</ScreenTitle>
      <EnigmaPanel fill={PANEL[state]} />
      <Image source={wg.src} style={{ position: 'absolute', left: wg.left, top: wg.top, width: wg.w, height: wg.h }} resizeMode="contain" />
      {state === 'saisie' ? (
        <ToggleGrid key={attempts} left={300} top={520} width={1200} height={220} count={4} onChange={setValue} />
      ) : null}
      {state === 'success' ? <Text style={styles.msg}>Félicitation, vous avez trouvé la bonne réponse !</Text> : null}
      {state === 'error' ? <Text style={styles.msg}>Votre solution n’est pas correcte</Text> : null}
      {state === 'saisie' ? <PrimaryButton label="Valider" top={1004} onPress={() => onValidate?.(value)} /> : null}
      {state === 'success' ? <PrimaryButton label="Continuer" top={1023} onPress={onContinue} /> : null}
      {state === 'error' ? (
        <PrimaryButton label={canRetry ? 'Recommencer' : 'Continuer'} top={1023} onPress={canRetry ? onRetry : onContinue} />
      ) : null}
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
