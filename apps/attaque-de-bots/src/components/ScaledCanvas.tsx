import type { JSX, ReactNode } from 'react'
import { StyleSheet, View, useWindowDimensions } from 'react-native'
import { DESIGN, colors } from '../theme/tokens'

// Fixed design canvas — the RN analog of the Assaut rem stage. The maquettes are a
// fixed 1920×1200; rather than reflow, the whole screen is one canvas scaled
// uniformly to fit the device by the limiting dimension, centred (letterboxed on
// off-aspect). Screens position their children at design px (maquette coordinates)
// inside this canvas, so layout stays maquette-exact at any tablet resolution.
export function ScaledCanvas({ children }: { readonly children: ReactNode }): JSX.Element {
  const { width, height } = useWindowDimensions()
  const scale = Math.min(width / DESIGN.width, height / DESIGN.height)
  return (
    <View style={styles.root}>
      <View style={[styles.canvas, { transform: [{ scale }] }]}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgDeep,
    overflow: 'hidden',
  },
  canvas: {
    width: DESIGN.width,
    height: DESIGN.height,
    position: 'relative',
  },
})
