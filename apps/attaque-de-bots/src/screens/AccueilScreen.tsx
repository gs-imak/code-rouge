import type { JSX } from 'react'
import { StyleSheet, Text } from 'react-native'
import { colors } from '../theme/tokens'
import { PrimaryButton } from '../components/PrimaryButton'
import { ScreenBackground } from '../components/ScreenBackground'
import type { ContinueProps } from '../navigation/types'

// « Accueil » (maquette frame 1:109): welcome / briefing screen shown after
// Connexion. Title (rendered uppercase per the maquette textCase) + briefing body
// + « Commencer » CTA, all at exact maquette px in the 1920×1200 canvas. The
// briefing body is Nathanaël's content (Figma comment on 1:109, 2026-06-08); his
// closing line said « Appuyez sur "OK" » but this screen's CTA is « Commencer »
// (maquette) — adapted + flagged. « Alpha » is a sample team; the real name is
// runtime data.
const BODY =
  'CYBER-ALERTE : INTRUSION DANS LES SYSTÈMES DE L’ENTREPRISE !\n\n' +
  'Agents de la Section 13, le système subit une attaque massive de virus informatiques lancée ' +
  'par le Réseau. Cette tablette est votre outil pour communiquer avec nos équipes techniques et ' +
  'lutter contre les bots.\n' +
  'Un accès direct à la messagerie des équipes informatiques vient de vous être ouvert : restez ' +
  'connectés, des informations capitales et des indices décisifs vont y apparaître pour vous guider.\n' +
  'Vos instructions :\n' +
  '• Choisissez vos cibles : sélectionnez l’attaque de Bot que vous souhaitez contrer en priorité.\n' +
  '• Neutralisez la menace : bloquez l’offensive en utilisant tout ce que vous trouverez à portée ' +
  'de main dans l’espace autour de vous.\n' +
  'Votre objectif est de contrer le maximum d’attaques dans le temps indiqué par le chrono sur ' +
  'l’écran. Attention : chaque échec ou retard fera chuter votre jauge de score.\n' +
  'Appuyez sur « Commencer » pour lancer la cyber-défense.'

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
  // Briefing body (maquette [277,330 1367×552] 36px/500 centre). Sized down
  // 36/46 → 32/42: the real briefing (≈13 lines) overflowed the maquette's
  // lorem-sized box into the « Commencer » button at 977. The maquette never
  // anticipated this text length — final type is Laura's call (flagged).
  body: {
    position: 'absolute',
    left: 277,
    top: 330,
    width: 1367,
    textAlign: 'center',
    color: colors.white,
    fontFamily: 'Roboto',
    fontSize: 32,
    fontWeight: '500',
    lineHeight: 42,
  },
})
