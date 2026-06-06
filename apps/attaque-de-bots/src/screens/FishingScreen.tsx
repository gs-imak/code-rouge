import type { JSX } from 'react'
import { Pressable, StyleSheet } from 'react-native'
import { HudHeader } from '../components/HudHeader'
import { RasterImage } from '../components/RasterImage'
import { ScreenBackground } from '../components/ScreenBackground'
import { DESIGN } from '../theme/tokens'
import codeRain from '../assets/bg-fishing.jpg'

// « Mail Fishing » (maquette frame 1:1297): the full-frame "hacking in progress"
// code-rain scene shown after the piégé phishing mail is opened. The scene is the
// maquette's « iStock-1048265360 » fill, exported from Figma and bundled locally
// (rule #3). REVIEW-BUILD NOTE: licensed iStock comp — swap for a licensed/owned
// raster before any shipped build. In the running app a tap anywhere dismisses the
// trap (back to the inbox); the dev Gallery renders it statically.
export function FishingScreen({ onContinue }: { readonly onContinue?: () => void } = {}): JSX.Element {
  return (
    <>
      <ScreenBackground />
      <RasterImage source={codeRain} style={styles.scene} />
      <HudHeader />
      {onContinue ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continuer"
          onPress={onContinue}
          style={styles.tap}
        />
      ) : null}
    </>
  )
}

const styles = StyleSheet.create({
  scene: { position: 'absolute', left: 0, top: 0, width: DESIGN.width, height: DESIGN.height },
  tap: { position: 'absolute', left: 0, top: 0, width: DESIGN.width, height: DESIGN.height },
})
