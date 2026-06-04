import type { JSX } from 'react'
import { HudHeader } from '../components/HudHeader'
import { EnigmaPanel } from '../components/EnigmaPanel'
import { MessageModal } from '../components/MessageModal'
import { ScreenBackground } from '../components/ScreenBackground'

// « Accueil Mot de passe Admin » (maquette frame 1:361): the briefing that opens the
// MDP énigme — the section-13 message modal over the énigme panel. The briefing text
// is the maquette copy; it becomes config content at wiring time.
export function MdpAccueilScreen(): JSX.Element {
  return (
    <>
      <ScreenBackground />
      <HudHeader />
      <EnigmaPanel />
      <MessageModal body="Nous avons besoin du mot de passe ADMIN du post IT de l’entreprise pour arrêter une des attaques de BOT. Fouillez le bureau IT pour retrouver ce mot de passe." />
    </>
  )
}
