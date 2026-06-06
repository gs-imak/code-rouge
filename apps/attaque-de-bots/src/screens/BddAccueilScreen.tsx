import type { JSX } from 'react'
import { Image, StyleSheet, Text } from 'react-native'
import { colors } from '../theme/tokens'
import { EnigmaPanel } from '../components/EnigmaPanel'
import { HudHeader } from '../components/HudHeader'
import { PrimaryButton } from '../components/PrimaryButton'
import { ScreenBackground } from '../components/ScreenBackground'
import type { ContinueProps } from '../navigation/types'
import picto from '../assets/bdd-picto.png'
import alertModal from '../assets/grad-alert-modal.png'

// « Accueil BDD » (maquette frame 1:475): a RED alert modal (not the shared dark
// MessageModal) — a red box (maquette « Rectangle 9221 » gradient #a21616→#3c0808
// @72°, a generated texture) with a warning picto, a single large alert block and a
// red OK. The « ... AP1 ... » codes are the maquette placeholder content.
export function BddAccueilScreen({ onContinue }: ContinueProps = {}): JSX.Element {
  return (
    <>
      <ScreenBackground />
      <HudHeader />
      <EnigmaPanel />
      <Image source={alertModal} style={styles.modal} resizeMode="stretch" />
      <Image source={picto} style={styles.picto} resizeMode="contain" />
      <Text style={styles.text}>
        Alerte !{'\n'}Tentatives de corruption des bases de données par les bots.{'\n\n'}Bots détectés dans les serveurs
        {'\n'}... AP1 ... cz ... IP ... HJ ...
      </Text>
      <PrimaryButton label="J’ai tout retenu" top={755} tone="red" onPress={onContinue} />
    </>
  )
}

const styles = StyleSheet.create({
  // Red alert box (maquette « Rectangle 9221 » [380,111 1161×803] gradient texture + stroke).
  modal: { position: 'absolute', left: 380, top: 111, width: 1161, height: 803, borderWidth: 2, borderColor: colors.panelStroke, borderRadius: 20 },
  // Warning picto (maquette « picto » [901,148 120×120]).
  picto: { position: 'absolute', left: 901, top: 148, width: 120, height: 120 },
  // (maquette [461,287 999×508] 46px/700 lh60 centre, multi-line, textCase UPPER).
  text: { position: 'absolute', left: 461, top: 287, width: 999, textAlign: 'center', textTransform: 'uppercase', color: colors.white, fontFamily: 'Roboto', fontSize: 46, fontWeight: '700', lineHeight: 60 },
})
