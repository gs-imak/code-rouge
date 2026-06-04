import type { JSX } from 'react'
import { Image, StyleSheet } from 'react-native'
import { HudHeader } from '../components/HudHeader'
import { EnigmaPanel } from '../components/EnigmaPanel'
import { PrimaryButton } from '../components/PrimaryButton'
import { ScreenBackground } from '../components/ScreenBackground'
import { ScreenTitle } from '../components/ScreenTitle'
import diagram from '../assets/res-diagram.png'

// « Saisie solution Réseau » (maquette frame 1:339): a network-map puzzle (click the
// access points). The diagram is a static maquette raster for the visual pass; the
// Valider sits bottom-right (its own position, so this doesn't use the EnigmeSaisie
// prompt/field shell). All px = maquette coords.
export function ResSaisieScreen(): JSX.Element {
  return (
    <>
      <ScreenBackground />
      <HudHeader />
      <ScreenTitle>coupure du réseau internet</ScreenTitle>
      <EnigmaPanel />
      <Image source={diagram} style={styles.diagram} resizeMode="contain" />
      <PrimaryButton label="Valider" top={1028} left={1567} width={260} />
    </>
  )
}

const styles = StyleSheet.create({
  // (maquette « image 9 » [337,202 1246×906]).
  diagram: { position: 'absolute', left: 337, top: 202, width: 1246, height: 906 },
})
