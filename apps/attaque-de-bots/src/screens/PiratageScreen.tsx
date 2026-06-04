import type { JSX } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme/tokens'
import { HudHeader } from '../components/HudHeader'
import { ScreenBackground } from '../components/ScreenBackground'
import logo from '../assets/pir-logo.png'
import dots from '../assets/pir-dots-4.png'

// « Accueil Piratage » (maquette frames 25:1547/1695/1843 — three identical-layout
// animation frames): the dramatic "you've been hacked by LE RÉSEAU" pattern-unlock.
// The full-frame code-rain is the licensed iStock scene → neutral placeholder (rule
// #3, same raster as Fishing). LE RÉSEAU logo + dot grid are static art; texts render
// uppercase per the maquette. All px = maquette coords.
export function PiratageScreen(): JSX.Element {
  return (
    <>
      <ScreenBackground />
      <HudHeader />
      <Image source={logo} style={styles.logo} resizeMode="contain" />
      <Text style={styles.alert}>Vous avez été piratés par Le réseau !{'\n'}Hahahah ! Nous voyons tout !</Text>
      <Text style={styles.prompt}>Dessinez un schéma de déverrouillage :</Text>
      <View style={styles.box} />
      <Image source={dots} style={styles.dots} resizeMode="contain" />
    </>
  )
}

const styles = StyleSheet.create({
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
