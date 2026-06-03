import type { JSX } from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'
import { colors } from '../theme/tokens'

// The shared « Buttom » CTA (maquette: 337×80 r20, orange gradient #ff740d→#fb5344,
// 34px/700 white centred label). The gradient is approximated by a solid accent for
// now — react-native-linear-gradient lands when polishing. Positioned by the caller
// at exact maquette px (left defaults to the canvas-centred 794; pass `top`). The
// 80px height clears the 48dp touch-target floor. `onPress` is optional so the dev
// gallery renders statically; screens wire navigation through it during BUILD.
export function PrimaryButton({
  label,
  top,
  left = 794,
  onPress,
}: {
  readonly label: string
  readonly top: number
  readonly left?: number
  readonly onPress?: () => void
}): JSX.Element {
  return (
    <Pressable style={[styles.button, { top, left }]} onPress={onPress}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    width: 337,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { color: colors.white, fontFamily: 'Roboto', fontSize: 34, fontWeight: '700' },
})
