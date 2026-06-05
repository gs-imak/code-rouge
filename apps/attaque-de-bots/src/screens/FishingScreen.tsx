import type { JSX } from 'react'
import { Pressable, StyleSheet } from 'react-native'
import { HudHeader } from '../components/HudHeader'
import { ScreenBackground } from '../components/ScreenBackground'
import { DESIGN } from '../theme/tokens'

// « Mail Fishing » (maquette frame 1:1297): the full-frame "hacking in progress"
// code-rain scene shown after the piégé phishing mail is opened. The scene is a
// single licensed iStock raster in the maquette → neutral dark placeholder until
// the graphiste delivers it (immutable rule #3). In the running app a tap anywhere
// dismisses the trap (back to the inbox); the dev Gallery renders it statically.
export function FishingScreen({ onContinue }: { readonly onContinue?: () => void } = {}): JSX.Element {
  return (
    <>
      <ScreenBackground />
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
  tap: { position: 'absolute', left: 0, top: 0, width: DESIGN.width, height: DESIGN.height },
})
