import { useState, type JSX } from 'react'
import { Image, StyleSheet, Text } from 'react-native'
import { colors } from '../theme/tokens'
import { HudHeader } from '../components/HudHeader'
import { EnigmaPanel } from '../components/EnigmaPanel'
import { PrimaryButton } from '../components/PrimaryButton'
import { ScreenBackground } from '../components/ScreenBackground'
import { ScreenTitle } from '../components/ScreenTitle'
import { TapGrid } from '../components/TapGrid'
import type { SaisieScreenProps } from '../navigation/types'
import diagram from '../assets/res-diagram.png'

// « Saisie solution Réseau » (maquette frame 1:339): a network-map puzzle (tap the
// access points in order). The diagram PNG stays as the visual; a coarse TapGrid over
// it makes node regions tappable, building a node sequence (e.g. "n1-n5"). The maquette
// has no bespoke success/error frame, so they are rendered here as a panel tint +
// message + CTA. Node hit-regions are bbox-derived — graphiste confirms exact zones.
const PANEL = { saisie: undefined, success: colors.panelSuccess, error: colors.panelError } as const

export function ResSaisieScreen({
  state = 'saisie',
  attempts = 0,
  canRetry = true,
  onValidate,
  onContinue,
  onRetry,
}: SaisieScreenProps = {}): JSX.Element {
  const [value, setValue] = useState('')
  return (
    <>
      <ScreenBackground />
      <HudHeader />
      <ScreenTitle>coupure du réseau internet</ScreenTitle>
      <EnigmaPanel fill={PANEL[state]} />
      <Image source={diagram} style={styles.diagram} resizeMode="contain" />
      {state === 'saisie' ? (
        <>
          <TapGrid
            key={attempts}
            left={337}
            top={202}
            width={1246}
            height={906}
            rows={2}
            cols={3}
            tokens={['n1', 'n2', 'n3', 'n4', 'n5', 'n6']}
            separator="-"
            feedback="cell"
            onChange={setValue}
          />
          <PrimaryButton label="Valider" top={1028} left={1567} width={260} onPress={() => onValidate?.(value)} />
        </>
      ) : null}
      {state !== 'saisie' ? (
        <Text style={styles.msg}>{state === 'success' ? 'Réseau neutralisé !' : 'Mauvais point d’accès'}</Text>
      ) : null}
      {state === 'success' ? (
        <PrimaryButton label="Continuer" top={1028} left={1567} width={260} onPress={onContinue} />
      ) : null}
      {state === 'error' ? (
        <PrimaryButton
          label={canRetry ? 'Recommancer' : 'Continuer'}
          top={1028}
          left={1567}
          width={260}
          onPress={canRetry ? onRetry : onContinue}
        />
      ) : null}
    </>
  )
}

const styles = StyleSheet.create({
  // (maquette « image 9 » [337,202 1246×906]).
  diagram: { position: 'absolute', left: 337, top: 202, width: 1246, height: 906 },
  // Success / error message (runner-only state, centred top of the panel).
  msg: {
    position: 'absolute',
    left: 337,
    top: 150,
    width: 1100,
    textAlign: 'center',
    color: colors.white,
    fontFamily: 'Roboto',
    fontSize: 40,
    fontWeight: '700',
  },
})
