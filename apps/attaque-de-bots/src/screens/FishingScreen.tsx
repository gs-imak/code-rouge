import type { JSX } from 'react'
import { HudHeader } from '../components/HudHeader'
import { ScreenBackground } from '../components/ScreenBackground'

// « Mail Fishing » (maquette frame 1:1297): the full-frame "hacking in progress"
// code-rain scene shown after the piégé phishing mail is opened. The scene is a
// single licensed iStock raster in the maquette → neutral dark placeholder until
// the graphiste delivers it (immutable rule #3), same treatment as the other
// full-frame photo backgrounds. Only the HUD sits on top.
export function FishingScreen(): JSX.Element {
  return (
    <>
      <ScreenBackground />
      <HudHeader />
    </>
  )
}
