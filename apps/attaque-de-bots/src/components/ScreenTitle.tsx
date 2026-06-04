import type { JSX } from 'react'
import { StyleSheet, Text } from 'react-native'
import { colors } from '../theme/tokens'

// The shared screen title (maquette [663,87 594×94] 32px/700 centre, textCase UPPER):
// the « énigme en cours » name on the énigme/Tuto screens and the « Mails » heading
// on the mailbox screens. lineHeight = box height so the glyph centres vertically in
// the 94px box like Figma. Sits just under the HUD divider.
export function ScreenTitle({ children }: { readonly children: string }): JSX.Element {
  return <Text style={styles.title}>{children}</Text>
}

const styles = StyleSheet.create({
  title: {
    position: 'absolute',
    left: 663,
    top: 87,
    width: 594,
    textAlign: 'center',
    textTransform: 'uppercase',
    color: colors.white,
    fontFamily: 'Roboto',
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 94,
  },
})
