import type { JSX } from 'react'
import { Image, StyleSheet, Text } from 'react-native'
import { colors } from '../theme/tokens'
import { EnigmaPanel } from '../components/EnigmaPanel'
import { HudHeader } from '../components/HudHeader'
import { ScreenBackground } from '../components/ScreenBackground'
import { ScreenTitle } from '../components/ScreenTitle'
import left from '../assets/fin-left.png'
import right from '../assets/fin-right.png'

// « Saisie Énigme Finale » (maquette 1:1306 / success 34:4720 / error 34:4945): the
// final code — find the symbols (left panel) and key the code on the right panel
// (3-box display + keypad). Both panels are static maquette art (shadow → placed at
// natural size centred on their bbox). success / error tint the panel + add a message.
// NOTE: the maquette finale result states (34:4720 / 34:4945) have NO CTA — unlike the
// other énigmes — so there is no Continuer/Recommancer here (verified against the render);
// navigation off the finale is handled externally.
type FinaleState = 'saisie' | 'success' | 'error'

const PANEL: Record<FinaleState, string | undefined> = { saisie: undefined, success: colors.panelSuccess, error: colors.panelError }

export function FinaleScreen({ state = 'saisie' }: { readonly state?: FinaleState } = {}): JSX.Element {
  return (
    <>
      <ScreenBackground />
      <HudHeader />
      <ScreenTitle>attaque de bot xc65</ScreenTitle>
      <EnigmaPanel fill={PANEL[state]} />
      <Image source={left} style={styles.left} resizeMode="contain" />
      <Image source={right} style={styles.right} resizeMode="contain" />
      {state === 'success' ? <Text style={[styles.msg, { top: 928 }]}>Félicitation,  vous avez trouvé le bon code !</Text> : null}
      {state === 'error' ? <Text style={[styles.msg, { top: 973 }]}>Le code est incorrecte</Text> : null}
    </>
  )
}

const styles = StyleSheet.create({
  // Left "symbols" panel (maquette bbox [237,446 680×418]; natural 748×486 centred).
  left: { position: 'absolute', left: 203, top: 412, width: 748, height: 486 },
  // Right "keypad + code" panel (maquette bbox [1017,200 665×909]; natural 733×977 centred).
  right: { position: 'absolute', left: 983, top: 166, width: 733, height: 977 },
  // Success / error message (maquette [163,~928 827×88] 44px/700 centre, left column).
  msg: { position: 'absolute', left: 163, width: 827, textAlign: 'center', color: colors.white, fontFamily: 'Roboto', fontSize: 44, fontWeight: '700', lineHeight: 50 },
})
