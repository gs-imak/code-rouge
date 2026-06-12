import { useState, type JSX } from 'react'
import { Image, StyleSheet, Text } from 'react-native'
import { colors } from '../theme/tokens'
import { EnigmaPanel } from '../components/EnigmaPanel'
import { HudHeader } from '../components/HudHeader'
import { PrimaryButton } from '../components/PrimaryButton'
import { ScreenBackground } from '../components/ScreenBackground'
import { ScreenTitle } from '../components/ScreenTitle'
import { ToggleGrid } from '../components/ToggleGrid'
import type { SaisieScreenProps } from '../navigation/types'
import row from '../assets/bdd-row.png'
import rowOk from '../assets/bdd-row-ok.png'
import rowErr from '../assets/bdd-row-err.png'
import rowOk2 from '../assets/bdd-row-ok2.png'
import rowErr2 from '../assets/bdd-row-err2.png'

// « Saisie solution BDD » (maquette 1:1175 / 41:6385 / 41:6117): pick the servers
// holding the databases to share. The server grid is static maquette art per state
// (one row on saisie, two on success / error); a ToggleGrid over the saisie row makes
// the servers selectable (bit-string, e.g. "1111"). success / error tint the panel +
// add a message + Continuer / Recommencer.
type SaisieState = NonNullable<SaisieScreenProps['state']>

const PANEL: Record<SaisieState, string | undefined> = { saisie: undefined, success: colors.panelSuccess, error: colors.panelError }
const ROW: Record<SaisieState, number> = { saisie: row, success: rowOk, error: rowErr }
const ROW2: Record<SaisieState, number | undefined> = { saisie: undefined, success: rowOk2, error: rowErr2 }

export function BddScreen({
  state = 'saisie',
  attempts = 0,
  canRetry = true,
  onValidate,
  onContinue,
  onRetry,
}: SaisieScreenProps = {}): JSX.Element {
  const [value, setValue] = useState('')
  const row2 = ROW2[state]
  return (
    <>
      <ScreenBackground />
      <HudHeader />
      <ScreenTitle>Bases de données attaquées</ScreenTitle>
      <EnigmaPanel fill={PANEL[state]} />
      <Text style={styles.instruction}>Sélectionnez les 4 serveurs contenant les bases de données à partager</Text>
      <Image source={ROW[state]} style={styles.row} resizeMode="contain" />
      {row2 ? <Image source={row2} style={styles.row2} resizeMode="contain" /> : null}
      {state === 'saisie' ? (
        <ToggleGrid key={attempts} left={404} top={375} width={1113} height={245} count={4} onChange={setValue} />
      ) : null}
      {state === 'success' ? <Text style={styles.msg}>Félicitation, vous avez trouvé la bonne réponse !</Text> : null}
      {state === 'error' ? <Text style={styles.msg}>Votre solution n’est pas correcte</Text> : null}
      {state === 'saisie' ? <PrimaryButton label="Valider" top={989} onPress={() => onValidate?.(value)} /> : null}
      {state === 'success' ? <PrimaryButton label="Continuer" top={1044} onPress={onContinue} /> : null}
      {state === 'error' ? (
        <PrimaryButton label={canRetry ? 'Recommencer' : 'Continuer'} top={1044} onPress={canRetry ? onRetry : onContinue} />
      ) : null}
    </>
  )
}

const styles = StyleSheet.create({
  // (maquette [514,234 893×79] 46px/700 lh48 centre vCenter, textCase UPPER → 2 lines).
  // Was lineHeight 79 (the box height) + no uppercase → sentence-case, double leading,
  // ghosted in the diff. lh48 = Figma per-line; vCentre the 2×48 block in the 79 box.
  instruction: { position: 'absolute', left: 514, top: 226, width: 893, textAlign: 'center', textTransform: 'uppercase', color: colors.white, fontFamily: 'Roboto', fontSize: 46, fontWeight: '700', lineHeight: 48 },
  // Server rows (maquette « Frame 23440/23441 » [404,375] / [404,676], 1113×245).
  row: { position: 'absolute', left: 404, top: 375, width: 1113, height: 245 },
  row2: { position: 'absolute', left: 404, top: 676, width: 1113, height: 245 },
  // Success / error message (maquette ~[.,933] 44px/700 centre, centred on 960).
  msg: { position: 'absolute', left: 330, top: 933, width: 1261, textAlign: 'center', color: colors.white, fontFamily: 'Roboto', fontSize: 44, fontWeight: '700' },
})
