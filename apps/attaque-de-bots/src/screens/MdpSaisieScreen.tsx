import { useState, type JSX } from 'react'
import { Image, StyleSheet } from 'react-native'
import { EnigmeSaisie } from '../components/EnigmeSaisie'
import { TapGrid } from '../components/TapGrid'
import type { SaisieScreenProps } from '../navigation/types'
import grid from '../assets/mdp-grid.png'

// « Saisie solution Mot de passe Admin » (maquette frame 1:244): the « code_motifs »
// 3×3 pattern grid. The static PNG stays as the visual; a transparent TapGrid overlay
// makes the cells tappable, building a dash-joined path (e.g. "0-1-2") validated by
// the engine against the step's `solution`. Cell hit-regions = bbox ÷ 3×3 (graphiste
// confirms exact zones with the final art).
export function MdpSaisieScreen({
  state = 'saisie',
  attempts = 0,
  canRetry,
  onValidate,
  onContinue,
  onRetry,
}: SaisieScreenProps = {}): JSX.Element {
  const [value, setValue] = useState('')
  return (
    <EnigmeSaisie
      title="mot de passe admin"
      prompt="Saisissez le mot de passe admin :"
      state={state}
      value={value}
      canRetry={canRetry}
      message={state === 'success' ? 'Bravo, mot de passe trouvé !' : state === 'error' ? 'Mot de passe incorrect' : undefined}
      onValidate={() => onValidate?.(value)}
      onContinue={onContinue}
      onRetry={onRetry}
    >
      <Image source={grid} style={styles.grid} resizeMode="contain" />
      {state === 'saisie' ? (
        <TapGrid
          key={attempts}
          left={325}
          top={409}
          width={492}
          height={492}
          rows={3}
          cols={3}
          tokens={['0', '1', '2', '3', '4', '5', '6', '7', '8']}
          separator="-"
          feedback="cell"
          onChange={setValue}
        />
      ) : null}
    </EnigmeSaisie>
  )
}

const styles = StyleSheet.create({
  // (maquette « code_motifs » [325,409 492×492]).
  grid: { position: 'absolute', left: 325, top: 409, width: 492, height: 492 },
})
