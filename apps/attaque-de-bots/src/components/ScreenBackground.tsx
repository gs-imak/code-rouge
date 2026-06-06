import type { JSX } from 'react'
import { Image, StyleSheet } from 'react-native'
import { isBgNoneHarness } from './harness'
import bgScreen from '../assets/bg-screen.png'

// Full-frame background (maquette « image 7 », a blurred photo on every screen),
// exported from the Figma fill and bundled locally — no runtime fetch (rule #3).
// REVIEW-BUILD NOTE: the maquette fill is licensed stock; swap for a licensed/owned
// raster before any shipped build. Single swap point: replace bg-screen.png here.
// Renders nothing under the `?bg=none` harness flag so the foreground-diff tool can
// composite the foreground over the real Figma background (see ./harness).
export function ScreenBackground(): JSX.Element | null {
  if (isBgNoneHarness()) return null
  return <Image source={bgScreen} style={styles.bg} resizeMode="cover" />
}

const styles = StyleSheet.create({
  bg: { position: 'absolute', left: 0, top: 0, width: 1920, height: 1200 },
})
