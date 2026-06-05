import type { JSX } from 'react'
import { Image, Pressable, StyleSheet, Text } from 'react-native'
import { colors } from '../theme/tokens'
import gradOrange from '../assets/grad-button-orange.png'
import gradRed from '../assets/grad-button-red.png'

// The shared « Buttom » CTA (maquette: 337×80 r20, 34px/700 white centred label).
// The vertical gradient (maquette #ff740d→#fb5344 @90°, or the BDD-alert red
// #e80101→#fb5344) is a generated texture stretched behind the label — a static-PNG
// fill, so no native gradient dependency and it is pixel-exact to the maquette on
// web and native. Positioned by the caller at maquette px (left defaults to the
// canvas-centred 794; pass `top`). 80px clears the 48dp touch-target floor.
// `onPress` is optional so the dev gallery renders statically.
export function PrimaryButton({
  label,
  top,
  left = 794,
  width = 337,
  tone = 'orange',
  onPress,
}: {
  readonly label: string
  readonly top: number
  readonly left?: number
  /** Override the 337px maquette default for the narrower per-énigme CTAs. */
  readonly width?: number
  /** « orange » default CTA, or « red » for the BDD alert OK. */
  readonly tone?: 'orange' | 'red'
  readonly onPress?: () => void
}): JSX.Element {
  return (
    <Pressable style={[styles.button, { top, left, width }]} onPress={onPress}>
      <Image source={tone === 'red' ? gradRed : gradOrange} style={styles.fill} resizeMode="stretch" />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    height: 80,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Gradient texture stretched to fill the (variable-width) button behind the label.
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  label: { color: colors.white, fontFamily: 'Roboto', fontSize: 34, fontWeight: '700' },
})
