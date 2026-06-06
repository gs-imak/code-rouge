import { useEffect, type JSX } from 'react'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme/tokens'
import { HudHeader } from '../components/HudHeader'
import { RasterImage } from '../components/RasterImage'
import { ScreenBackground } from '../components/ScreenBackground'
import type { TimedProps } from '../navigation/types'
import logo from '../assets/pir-logo.png'
import dots from '../assets/pir-dots-4.png'
import codeRain from '../assets/bg-fishing.jpg'

// « Accueil Piratage » (maquette frames 25:1547/1695/1843 — three identical-layout
// animation frames): the dramatic "you've been hacked by LE RÉSEAU" pattern-unlock.
// The full-frame code-rain is the maquette's « iStock-1048265360 » fill (same raster
// as Fishing), exported from Figma (rule #3). REVIEW-BUILD NOTE: licensed iStock comp
// — swap before any shipped build. LE RÉSEAU logo + dot grid are static art; texts
// render uppercase per the maquette. All px = maquette coords.
export function PiratageScreen({ onDone }: TimedProps = {}): JSX.Element {
  // The unlock auto-resolves after the dramatic beat; a tap on the pattern box
  // skips it. Inert in the dev Gallery (no onDone).
  useEffect(() => {
    if (!onDone) return undefined
    const timer = setTimeout(onDone, 5000)
    return () => clearTimeout(timer)
  }, [onDone])
  return (
    <>
      <ScreenBackground />
      <RasterImage source={codeRain} style={styles.scene} />
      <HudHeader />
      <Image source={logo} style={styles.logo} resizeMode="contain" />
      <Text style={styles.alert}>Vous avez été piratés par Le réseau !{'\n'}Hahahah ! Nous voyons tout !</Text>
      <Text style={styles.prompt}>Dessinez un schéma de déverrouillage :</Text>
      <View style={styles.box} />
      <Image source={dots} style={styles.dots} resizeMode="contain" />
      {onDone ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Déverrouiller"
          onPress={onDone}
          style={styles.box}
        />
      ) : null}
    </>
  )
}

const styles = StyleSheet.create({
  // Full-frame code-rain scene (maquette « iStock-1048265360 » fill).
  scene: { position: 'absolute', left: 0, top: 0, width: 1920, height: 1200 },
  // (maquette « Calque_6 » [802,56 316×311]).
  logo: { position: 'absolute', left: 802, top: 56, width: 316, height: 311 },
  // (maquette [460,403 999×94] 46px/700 centre, textCase UPPER).
  alert: { position: 'absolute', left: 460, top: 403, width: 999, textAlign: 'center', textTransform: 'uppercase', color: colors.white, fontFamily: 'Roboto', fontSize: 46, fontWeight: '700', lineHeight: 58 },
  // (maquette [587,533 745×79] 36px/700 centre, textCase UPPER).
  prompt: { position: 'absolute', left: 587, top: 533, width: 745, textAlign: 'center', textTransform: 'uppercase', color: colors.white, fontFamily: 'Roboto', fontSize: 36, fontWeight: '700', lineHeight: 79 },
  // Pattern-unlock box (maquette « Rectangle 9222 » [720,636 480×442] black, white@50% border).
  box: { position: 'absolute', left: 720, top: 636, width: 480, height: 442, backgroundColor: '#000000', borderWidth: 1.33, borderColor: colors.panelStroke, borderRadius: 20 },
  // 3×3 dot grid (maquette « ronds » bbox [805,735 310×244]; natural 320×252 centred).
  dots: { position: 'absolute', left: 800, top: 731, width: 320, height: 252 },
})
