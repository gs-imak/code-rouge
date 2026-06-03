/// <reference lib="dom" />
import type { JSX } from 'react'
import { ScaledCanvas } from '../components/ScaledCanvas'
import { ConnexionScreen } from '../screens/ConnexionScreen'

// DEV-ONLY web gallery (react-native-web harness). `?screen=<name>` renders one
// screen inside the ScaledCanvas so it can be screenshot + pixel-diffed against
// the Figma maquette — the Assaut `?screen=` loop, adapted for RN. Never bundled
// into the native app (Metro builds from index.js → App).
const SCREENS: Record<string, () => JSX.Element> = {
  connexion: () => <ConnexionScreen />,
}

export function Gallery(): JSX.Element {
  const name = new URLSearchParams(window.location.search).get('screen') ?? 'connexion'
  const render = SCREENS[name]
  return <ScaledCanvas>{render ? render() : <ConnexionScreen />}</ScaledCanvas>
}
