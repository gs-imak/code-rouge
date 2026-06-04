import type { JSX } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme/tokens'
import { ScreenBackground } from '../components/ScreenBackground'
import trophy from '../assets/trophy.png'

// « Fin » (maquette frame 1:87): the end-of-game score screen. Trophy emblem, the
// « Félicitation » + « Votre score » headings (uppercase per the maquette), the big
// layered score in a translucent orange box, and the wait-for-the-agent footer. The
// score « 13 456 » is the maquette placeholder; the real total comes from game state
// at wiring time. All px = maquette coords.
export function FinScreen(): JSX.Element {
  return (
    <>
      <ScreenBackground />
      {/* Trophy + laurels emblem (maquette « Group » [837,100 246×162]). */}
      <Image source={trophy} style={styles.trophy} resizeMode="contain" />
      <Text style={styles.felicitation}>Félicitation équipe Alpha !</Text>
      <Text style={styles.scoreLabel}>Votre score :</Text>
      {/* Score box (maquette « Rectangle 9232 » [545,593 831×257] #fd6537@27% r40). */}
      <View style={styles.scoreBox} />
      {/* Layered score: orange drop-shadow behind the white digits. */}
      <Text style={[styles.score, styles.scoreShadow]}>13 456</Text>
      <Text style={[styles.score, styles.scoreWhite]}>13 456</Text>
      <Text style={styles.pts}>pts</Text>
      <Text style={styles.footer}>
        Veuillez attendre les instructions de l’Agent de la Section 13 sur place.
      </Text>
    </>
  )
}

const styles = StyleSheet.create({
  trophy: { position: 'absolute', left: 837, top: 100, width: 246, height: 162 },
  // (maquette [426,310 1068×139] 70px/700 centre, textCase UPPER).
  felicitation: {
    position: 'absolute',
    left: 426,
    top: 310,
    width: 1068,
    textAlign: 'center',
    textTransform: 'uppercase',
    color: colors.white,
    fontFamily: 'Roboto',
    fontSize: 70,
    fontWeight: '700',
    lineHeight: 139,
  },
  // (maquette [547,472 826×139] 46px/700 centre, textCase UPPER).
  scoreLabel: {
    position: 'absolute',
    left: 547,
    top: 472,
    width: 826,
    textAlign: 'center',
    textTransform: 'uppercase',
    color: colors.white,
    fontFamily: 'Roboto',
    fontSize: 46,
    fontWeight: '700',
  },
  scoreBox: { position: 'absolute', left: 545, top: 593, width: 831, height: 257, backgroundColor: colors.scoreBox, borderRadius: 40 },
  // (maquette « 13 456 » 190px/700 centre — orange [581,653] under white [572,645]).
  score: { position: 'absolute', width: 660, height: 139, textAlign: 'center', fontFamily: 'Roboto', fontSize: 190, fontWeight: '700' },
  scoreShadow: { left: 581, top: 653, color: colors.scoreShadow },
  scoreWhite: { left: 572, top: 645, color: colors.white },
  // (maquette « pts » [1171,715 178×90] 70px/700 centre, ls -1.4).
  pts: {
    position: 'absolute',
    left: 1171,
    top: 715,
    width: 178,
    textAlign: 'center',
    color: colors.white,
    fontFamily: 'Roboto',
    fontSize: 70,
    fontWeight: '700',
    letterSpacing: -1.4,
  },
  // (maquette [346,1006 1195×71] 36px/500 centre).
  footer: {
    position: 'absolute',
    left: 346,
    top: 1006,
    width: 1195,
    textAlign: 'center',
    color: colors.white,
    fontFamily: 'Roboto',
    fontSize: 36,
    fontWeight: '500',
  },
})
