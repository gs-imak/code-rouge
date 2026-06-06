import type { JSX, ReactNode } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import { colors } from '../theme/tokens'
import { HudHeader } from './HudHeader'
import { EnigmaPanel } from './EnigmaPanel'
import { PrimaryButton } from './PrimaryButton'
import { ScreenBackground } from './ScreenBackground'
import { ScreenTitle } from './ScreenTitle'

// Shared shell for an énigme's « saisie » and its success / error states (the
// énigmes that have no bespoke success/error art — mdp, téléphone, réseau — reuse
// this; serveurs/dd/bdd/lecteur keep their own state art). Layout:
//   - énigme name + content panel (panel tints green/error per state)
//   - the bespoke input widget on the left (children, positioned by the screen)
//   - the common prompt + field + Valider on the right (maquette « Frame 23439 »)
//
// Called bare (state 'saisie', no value, no callbacks) it renders exactly the
// original static screen, so the dev Gallery pixel-diff is unchanged. The running
// app passes state/value/handlers to make it interactive.
export type SaisieState = 'saisie' | 'success' | 'error'

const PANEL_FILL: Record<SaisieState, string | undefined> = {
  saisie: undefined,
  success: colors.panelSuccess,
  error: colors.panelError,
}

export function EnigmeSaisie({
  title,
  prompt,
  state = 'saisie',
  value = '',
  onChangeValue,
  onValidate,
  onContinue,
  onRetry,
  canRetry = true,
  message,
  children,
}: {
  readonly title: string
  readonly prompt: string
  readonly state?: SaisieState
  readonly value?: string
  /**
   * Present → the field is a typed TextInput (text-answer énigmes like bdd/finale).
   * Absent → the field is read-only and driven by the on-canvas widget (pattern
   * grid, keypad, toggles…).
   */
  readonly onChangeValue?: (value: string) => void
  readonly onValidate?: () => void
  readonly onContinue?: () => void
  readonly onRetry?: () => void
  /** Error state: offer Recommancer (true) vs Continuer once attempts are capped. */
  readonly canRetry?: boolean
  /** Success / error feedback line. */
  readonly message?: string
  readonly children: ReactNode
}): JSX.Element {
  return (
    <>
      <ScreenBackground />
      <HudHeader />
      <ScreenTitle>{title}</ScreenTitle>
      <EnigmaPanel fill={PANEL_FILL[state]} />
      {children}

      {state === 'saisie' ? (
        <>
          <Text style={styles.prompt}>{prompt}</Text>
          {onChangeValue ? (
            <TextInput
              style={[styles.field, styles.fieldText]}
              value={value}
              onChangeText={onChangeValue}
              onSubmitEditing={onValidate}
              autoCapitalize="characters"
              autoCorrect={false}
              accessibilityLabel={prompt}
            />
          ) : (
            <View style={styles.field}>
              <Text style={styles.fieldText}>{value}</Text>
            </View>
          )}
          <PrimaryButton label="Valider" top={746} left={1151} onPress={onValidate} />
        </>
      ) : null}

      {state !== 'saisie' && message !== undefined ? <Text style={styles.message}>{message}</Text> : null}
      {state === 'success' ? (
        <PrimaryButton label="Continuer" top={746} left={1151} onPress={onContinue} />
      ) : null}
      {state === 'error' ? (
        canRetry ? (
          <PrimaryButton label="Recommancer" top={746} left={1151} onPress={onRetry} />
        ) : (
          <PrimaryButton label="Continuer" top={746} left={1151} onPress={onContinue} />
        )
      ) : null}
    </>
  )
}

const styles = StyleSheet.create({
  // (maquette [1005,484 625×79] 36px/700 centre vCenter, textCase UPPER — single line,
  // so lineHeight = box height centres the glyph like Figma's vertical-centre).
  prompt: {
    position: 'absolute',
    left: 1005,
    top: 484,
    width: 625,
    textAlign: 'center',
    textTransform: 'uppercase',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldText: {
    width: '100%',
    textAlign: 'center',
    color: colors.white,
    fontFamily: 'Roboto',
    fontSize: 34,
    fontWeight: '700',
  },
  // Success / error feedback, centred over the right column (runner-only state).
  message: {
    position: 'absolute',
    left: 940,
    top: 470,
    width: 760,
    textAlign: 'center',
    color: colors.white,
    fontFamily: 'Roboto',
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 44,
  },
})
