import type { JSX, ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme/tokens'
import { HudHeader } from './HudHeader'
import { EnigmaPanel } from './EnigmaPanel'
import { PrimaryButton } from './PrimaryButton'
import { ScreenBackground } from './ScreenBackground'
import { ScreenTitle } from './ScreenTitle'

// Shared shell for every énigme's « saisie » (the answer screen): énigme name + panel,
// the bespoke input widget on the left (passed as children, positioned by the screen
// at maquette px), and the common prompt + field + Valider on the right (identical
// coords across énigmes — maquette « Frame 23439 »). The field is display-only here;
// entry + validation are wired later. Success / error are states of this screen.
export function EnigmeSaisie({
  title,
  prompt,
  children,
}: {
  readonly title: string
  readonly prompt: string
  readonly children: ReactNode
}): JSX.Element {
  return (
    <>
      <ScreenBackground />
      <HudHeader />
      <ScreenTitle>{title}</ScreenTitle>
      <EnigmaPanel />
      {children}
      <Text style={styles.prompt}>{prompt}</Text>
      <View style={styles.field} />
      <PrimaryButton label="Valider" top={746} left={1151} />
    </>
  )
}

const styles = StyleSheet.create({
  // (maquette [1005,484 625×79] 36px/700 centre).
  prompt: {
    position: 'absolute',
    left: 1005,
    top: 484,
    width: 625,
    textAlign: 'center',
    color: colors.white,
    fontFamily: 'Roboto',
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 79,
  },
  // (maquette « Rectangle 9221 » [1021,582 610×108] white@19% 2px white r20).
  field: {
    position: 'absolute',
    left: 1021,
    top: 582,
    width: 610,
    height: 108,
    backgroundColor: colors.fieldFill,
    borderWidth: 2,
    borderColor: colors.fieldBorder,
    borderRadius: 20,
  },
})
