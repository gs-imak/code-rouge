import type { JSX } from 'react'
import { StyleSheet, View } from 'react-native'
import { colors } from '../theme/tokens'
import { isBgNoneHarness } from './harness'

// Full-frame background (maquette « image 7 », a blurred photo on every screen).
// Neutral dark placeholder until the graphiste delivers the real raster — the
// licensed photo is not bundled (immutable rule #3). Single swap point: when the
// asset lands, replace this View with an <Image> here only.
// Renders nothing under the `?bg=none` harness flag so the foreground-diff tool can
// composite the foreground over the real Figma background (see ./harness).
export function ScreenBackground(): JSX.Element | null {
  if (isBgNoneHarness()) return null
  return <View style={styles.bg} />
}

const styles = StyleSheet.create({
  bg: { position: 'absolute', left: 0, top: 0, width: 1920, height: 1200, backgroundColor: colors.bgPlaceholder },
})
