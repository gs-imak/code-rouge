import type { JSX } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme/tokens'
import { PrimaryButton } from '../components/PrimaryButton'
import { ScreenBackground } from '../components/ScreenBackground'
import type { ContinueProps } from '../navigation/types'

// « Accueil » (maquette frame 1:109, Laura's 2026-06-11 layout pass): the briefing
// title is now « CYBER-ALERTE … » (the « Bienvenue équipe Alpha ! » welcome is gone)
// and the body is flush-left with two bulleted instruction lines (her comment on
// 1:109: « passage de centré à ferré à gauche pour s'adapter au nouveau texte et ses
// bullet points »). The maquette body closes with « Appuyez sur "OK" » but this
// screen's CTA is « Commencer » — kept adapted + flagged, as in PR #36.
const PARA_1 =
  'Agents de la Section 13, le système subit une attaque massive de virus informatiques lancée ' +
  'par le Réseau. Cette tablette est votre outil pour communiquer avec nos équipes techniques et ' +
  'lutter contre les bots. Un accès direct à la messagerie des équipes informatiques vient de ' +
  'vous être ouvert : restez connectés, des informations capitales et des indices décisifs vont ' +
  'y apparaître pour vous guider. Vos instructions :'
const BULLET_1 =
  'Choisissez vos cibles : Sélectionnez l’attaque de Bot que vous souhaitez contrer en priorité.'
const BULLET_2 =
  'Neutralisez la menace : Bloquez l’offensive en utilisant tout ce que vous trouverez à portée ' +
  'de main dans l’espace autour de vous.'
const PARA_2 =
  'Votre objectif est de contrer le maximum d’attaques dans le temps indiqué par le chrono sur ' +
  'l’écran. Attention : chaque échec ou retard fera chuter votre jauge de score. Appuyez sur ' +
  '« Commencer » pour lancer la cyber-défense.'

export function AccueilScreen({ onContinue }: ContinueProps = {}): JSX.Element {
  return (
    <>
      <ScreenBackground />
      <Text style={styles.title}>CYBER-ALERTE : INTRUSION DANS LES SYSTÈMES DE L’ENTREPRISE !</Text>
      <View style={styles.body}>
        <Text style={styles.par}>{PARA_1}</Text>
        <View style={styles.bulletRow}>
          <Text style={[styles.par, styles.bulletGlyph]}>•</Text>
          <Text style={[styles.par, styles.bulletText]}>{BULLET_1}</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={[styles.par, styles.bulletGlyph]}>•</Text>
          <Text style={[styles.par, styles.bulletText]}>{BULLET_2}</Text>
        </View>
        <Text style={styles.par}>{PARA_2}</Text>
      </View>
      <PrimaryButton label="Commencer" top={1070} onPress={onContinue} />
    </>
  )
}

const styles = StyleSheet.create({
  // Title (maquette [406,131 1109×133] 70px/700 lh73 centre, vCentre — 2 wrapped
  // lines of 73 overflow the 133px box by 13, so start 6px above the box top).
  // Box widened 1109 → 1309 on the same centre: Roboto (our bundled font) runs
  // wider than the maquette's display font at 70px and would wrap to 3 lines,
  // colliding with the body. Revisit when the final maquette font is bundled.
  title: {
    position: 'absolute',
    left: 306,
    top: 125,
    width: 1309,
    textAlign: 'center',
    color: colors.white,
    fontFamily: 'Roboto',
    fontSize: 70,
    fontWeight: '700',
    lineHeight: 73,
  },
  // Briefing body (maquette [334,307 1252×704] 36px/500 lh47 LEFT). The bullet
  // lines are Figma UNORDERED list lines at indent 1 → bullet column + hanging
  // indent, matching the maquette render.
  body: { position: 'absolute', left: 334, top: 307, width: 1252, height: 704 },
  par: {
    color: colors.white,
    textAlign: 'left',
    fontFamily: 'Roboto',
    fontSize: 36,
    fontWeight: '500',
    lineHeight: 47,
  },
  bulletRow: { flexDirection: 'row', paddingLeft: 24 },
  bulletGlyph: { width: 32 },
  bulletText: { flex: 1 },
})
