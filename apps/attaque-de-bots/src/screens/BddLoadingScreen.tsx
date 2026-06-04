import type { JSX } from 'react'
import { Image, StyleSheet, Text } from 'react-native'
import { colors } from '../theme/tokens'
import { HudHeader } from '../components/HudHeader'
import { ScreenBackground } from '../components/ScreenBackground'
import spinner from '../assets/bdd-spinner.png'

// « Loading bases de données » (maquette frame 1:530, in the 2.9 section but its copy
// is the BDD load): the wait screen between the BDD briefing and the saisie — just the
// HUD, a centred message (uppercase per the maquette) and a spinner. All px = maquette
// coords.
export function BddLoadingScreen(): JSX.Element {
  return (
    <>
      <ScreenBackground />
      <HudHeader />
      <Text style={styles.label}>Chargement des bases de données en cours</Text>
      <Image source={spinner} style={styles.spinner} resizeMode="contain" />
    </>
  )
}

const styles = StyleSheet.create({
  // (maquette [447,199 1027×78] 36px/400 centre, textCase UPPER).
  label: {
    position: 'absolute',
    left: 447,
    top: 199,
    width: 1027,
    textAlign: 'center',
    textTransform: 'uppercase',
    color: colors.white,
    fontFamily: 'Roboto',
    fontSize: 36,
    fontWeight: '400',
  },
  // (maquette « loading 1 » [926,259 68×68]).
  spinner: { position: 'absolute', left: 926, top: 259, width: 68, height: 68 },
})
