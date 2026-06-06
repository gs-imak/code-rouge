import type { JSX } from 'react'
import { StyleSheet, Text } from 'react-native'
import { colors } from '../theme/tokens'
import { PrimaryButton } from '../components/PrimaryButton'
import { ScreenBackground } from '../components/ScreenBackground'
import type { ContinueProps } from '../navigation/types'

// « Accueil » (maquette frame 1:109): welcome / briefing screen shown after
// Connexion. Title (rendered uppercase per the maquette textCase) + briefing body
// + « Commencer » CTA, all at exact maquette px in the 1920×1200 canvas. The
// briefing body is content (Nathanaël) — blank until it lands rather than shipping
// the maquette's lorem placeholder. « Alpha » is a sample team; the real name is
// runtime data.
const BODY = ''

export function AccueilScreen({ onContinue }: ContinueProps = {}): JSX.Element {
  return (
    <>
      <ScreenBackground />
      <Text style={styles.title}>Bienvenue équipe Alpha !</Text>
      <Text style={styles.body}>{BODY}</Text>
      <PrimaryButton label="Commencer" top={977} onPress={onContinue} />
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
