import { useState, type JSX } from 'react'
import { Image, StyleSheet } from 'react-native'
import { EnigmeSaisie } from '../components/EnigmeSaisie'
import { TapGrid } from '../components/TapGrid'
import type { SaisieScreenProps } from '../navigation/types'
import cadran from '../assets/tel-cadran.png'

// « Saisie solution Téléphone » (maquette frame 1:273): the « cadran_chiffres » phone
// keypad. The PNG stays as the visual; a TapGrid overlay maps the 3×4 digit layout to
// taps that build the entered code (e.g. "2580"). NOTE: the maquette title still reads
// « mot de passe admin » (leftover) — reproduced 1:1 and flagged for the graphiste.
export function TelSaisieScreen({
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
      prompt="Saisissez le code de débuggage :"
      state={state}
      value={value}
      canRetry={canRetry}
      message={state === 'success' ? 'Code accepté !' : state === 'error' ? 'Code incorrect' : undefined}
      onValidate={() => onValidate?.(value)}
      onContinue={onContinue}
      onRetry={onRetry}
    >
      <Image source={cadran} style={styles.cadran} resizeMode="contain" />
      {state === 'saisie' ? (
        <TapGrid
          key={attempts}
          left={331}
          top={335}
          width={480}
          height={640}
          rows={4}
          cols={3}
          tokens={['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '']}
          separator=""
          feedback="none"
          onChange={setValue}
        />
      ) : null}
    </EnigmeSaisie>
  )
}

const styles = StyleSheet.create({
  // (maquette « cadran_chiffres » [331,335 480×640]).
  cadran: { position: 'absolute', left: 331, top: 335, width: 480, height: 640 },
})
