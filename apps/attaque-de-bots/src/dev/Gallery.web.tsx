/// <reference lib="dom" />
import type { JSX } from 'react'
import { ScaledCanvas } from '../components/ScaledCanvas'
import { AccueilScreen } from '../screens/AccueilScreen'
import { AdminScreen } from '../screens/AdminScreen'
import { BoiteMailsScreen } from '../screens/BoiteMailsScreen'
import { CARDS_2, CARDS_3, ChoixScreen } from '../screens/ChoixScreen'
import { ConnexionScreen } from '../screens/ConnexionScreen'
import { FinScreen } from '../screens/FinScreen'
import { FishingScreen } from '../screens/FishingScreen'
import { MailsScreen } from '../screens/MailsScreen'
import { MdpAccueilScreen } from '../screens/MdpAccueilScreen'
import { MdpSaisieScreen } from '../screens/MdpSaisieScreen'
import { TelAccueilScreen } from '../screens/TelAccueilScreen'
import { TelSaisieScreen } from '../screens/TelSaisieScreen'
import { TutoScreen } from '../screens/TutoScreen'

// DEV-ONLY web gallery (react-native-web harness). `?screen=<name>` renders one
// screen inside the ScaledCanvas so it can be screenshot + pixel-diffed against
// the Figma maquette — the Assaut `?screen=` loop, adapted for RN. Never bundled
// into the native app (Metro builds from index.js → App).
const SCREENS: Record<string, () => JSX.Element> = {
  connexion: () => <ConnexionScreen />,
  accueil: () => <AccueilScreen />,
  tuto: () => <TutoScreen />,
  choix: () => <ChoixScreen cards={CARDS_2} />,
  choix3: () => <ChoixScreen cards={CARDS_3} />,
  boitemails: () => <BoiteMailsScreen />,
  mails: () => <MailsScreen />,
  fishing: () => <FishingScreen />,
  fin: () => <FinScreen />,
  admin: () => <AdminScreen />,
  'mdp-accueil': () => <MdpAccueilScreen />,
  'mdp-saisie': () => <MdpSaisieScreen />,
  'tel-accueil': () => <TelAccueilScreen />,
  'tel-saisie': () => <TelSaisieScreen />,
}

export function Gallery(): JSX.Element {
  const name = new URLSearchParams(window.location.search).get('screen') ?? 'connexion'
  const render = SCREENS[name]
  return <ScaledCanvas>{render ? render() : <ConnexionScreen />}</ScaledCanvas>
}
