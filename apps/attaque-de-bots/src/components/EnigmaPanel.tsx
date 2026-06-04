import type { JSX } from 'react'
import { StyleSheet, View } from 'react-native'
import { colors } from '../theme/tokens'

// The shared énigme content panel (maquette « Rectangle 9220 » [72,181 1777×948]
// #000@30% stroke #ffffff@50% r21): the large translucent frame that holds every
// énigme's widgets (and the dimmed backdrop on Tuto). Children are positioned over
// it at maquette px by the screen.
export function EnigmaPanel(): JSX.Element {
  return <View style={styles.panel} />
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    left: 72,
    top: 181,
    width: 1777,
    height: 948,
    backgroundColor: colors.panelDim,
    borderWidth: 2,
    borderColor: colors.panelStroke,
    borderRadius: 21,
  },
})
