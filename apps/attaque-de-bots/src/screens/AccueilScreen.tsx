import type { JSX } from 'react'
import { StyleSheet, Text } from 'react-native'
import { colors } from '../theme/tokens'
import { PrimaryButton } from '../components/PrimaryButton'
import { ScreenBackground } from '../components/ScreenBackground'

// « Accueil » (maquette frame 1:109): welcome / briefing screen shown after
// Connexion. Title (rendered uppercase per the maquette textCase) + briefing body
// + « Commencer » CTA, all at exact maquette px in the 1920×1200 canvas. The body
// is the maquette's lorem placeholder; the real briefing text arrives as config
// content (see the énigme-content follow-up).
const BODY =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.\n\nSed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.'

export function AccueilScreen(): JSX.Element {
  return (
    <>
      <ScreenBackground />
      <Text style={styles.title}>Bienvenue équipe Alpha !</Text>
      <Text style={styles.body}>{BODY}</Text>
      <PrimaryButton label="Commencer" top={977} />
    </>
  )
}

const styles = StyleSheet.create({
  // Title (maquette « Bienvenue équipe Alpha ! » [406,170 1109×133] 70px/700 centre,
  // textCase UPPER).
  title: {
    position: 'absolute',
    left: 406,
    top: 178,
    width: 1109,
    textAlign: 'center',
    textTransform: 'uppercase',
    color: colors.white,
    fontFamily: 'Roboto',
    fontSize: 70,
    fontWeight: '700',
  },
  // Briefing body (maquette [277,330 1367×552] 36px/500 centre).
  body: {
    position: 'absolute',
    left: 277,
    top: 330,
    width: 1367,
    textAlign: 'center',
    color: colors.white,
    fontFamily: 'Roboto',
    fontSize: 36,
    fontWeight: '500',
    lineHeight: 46,
  },
})
