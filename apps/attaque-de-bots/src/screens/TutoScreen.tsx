import type { JSX } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme/tokens'
import { HudHeader } from '../components/HudHeader'
import { EnigmaPanel } from '../components/EnigmaPanel'
import { PrimaryButton } from '../components/PrimaryButton'
import { ScreenBackground } from '../components/ScreenBackground'
import { ScreenTitle } from '../components/ScreenTitle'

// « Tuto » (maquette frame 1:222): a one-time overlay that explains the HUD before
// the first énigme. The énigme behind (title + content panel) is dimmed by a
// full-screen scrim; the HUD bar is drawn on top, bright, with four callout lines
// pointing to its parts and a label under each, then a « J'ai compris » CTA.
// Children are absolutely positioned at exact maquette px (z-order = JSX order).
export function TutoScreen(): JSX.Element {
  return (
    <>
      <ScreenBackground />
      {/* Énigme behind, dimmed by the scrim below. */}
      <ScreenTitle>Attaque du système de téléphonie</ScreenTitle>
      <EnigmaPanel />
      {/* Full-screen scrim (maquette « Rectangle 9231 » [0,-15 1944×1388] #000@50%). */}
      <View style={styles.scrim} />
      {/* HUD, highlighted above the scrim. */}
      <HudHeader />
      {/* Callout lines (maquette « Line 28-31 », white 2px verticals). */}
      <View style={[styles.callout, { left: 317, top: 68, height: 126 }]} />
      <View style={[styles.callout, { left: 959, top: 161, height: 51 }]} />
      <View style={[styles.callout, { left: 1425, top: 44, height: 157 }]} />
      <View style={[styles.callout, { left: 1756, top: 76, height: 125 }]} />
      {/* Labels (maquette 42px/400 centre). */}
      <Text style={[styles.label, { left: 86, top: 214, width: 464 }]}>Boite mail et notifications</Text>
      <Text style={[styles.label, { left: 694, top: 214, width: 532 }]}>Nom de l’énigme en cours</Text>
      <Text style={[styles.label, { left: 1241, top: 214, width: 371 }]}>Jauge de score</Text>
      <Text style={[styles.label, { left: 1691, top: 214, width: 136 }]}>Timer</Text>
      <PrimaryButton label="J’ai compris" top={560} />
    </>
  )
}

const styles = StyleSheet.create({
  scrim: { position: 'absolute', left: 0, top: -15, width: 1944, height: 1388, backgroundColor: colors.scrim },
  callout: { position: 'absolute', width: 2, backgroundColor: colors.white },
  label: {
    position: 'absolute',
    textAlign: 'center',
    color: colors.white,
    fontFamily: 'Roboto',
    fontSize: 42,
    fontWeight: '400',
    lineHeight: 42,
  },
})
