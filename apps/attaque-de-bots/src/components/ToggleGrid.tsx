import { useState, type JSX } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { colors } from '../theme/tokens'

// Interactive overlay for ON/OFF énigmes (serveurs power toggles, disk platters):
// N independently-togglable cells laid over the widget's maquette bbox in one row.
// Emits a bit-string (e.g. "1010") for validation against `solution`. Like TapGrid,
// hit regions are bbox ÷ count; final art + exact zones are a graphiste follow-up.
export interface ToggleGridProps {
  readonly left: number
  readonly top: number
  readonly width: number
  readonly height: number
  readonly count: number
  readonly onChange: (bits: string) => void
}

export function ToggleGrid({ left, top, width, height, count, onChange }: ToggleGridProps): JSX.Element {
  const [on, setOn] = useState<readonly boolean[]>(() => Array.from({ length: count }, () => false))
  const cellW = width / count

  function toggle(index: number): void {
    const next = on.map((v, i) => (i === index ? !v : v))
    setOn(next)
    onChange(next.map((v) => (v ? '1' : '0')).join(''))
  }

  return (
    <>
      {on.map((isOn, index) => (
        <Pressable
          // Fixed-length, index-keyed list (toggles never reorder) — index key is stable here.
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          accessibilityRole="switch"
          accessibilityState={{ checked: isOn }}
          onPress={() => toggle(index)}
          style={[styles.cell, { left: left + index * cellW, top, width: cellW, height }]}
        >
          {isOn ? <View style={styles.on} /> : null}
        </Pressable>
      ))}
    </>
  )
}

const styles = StyleSheet.create({
  cell: { position: 'absolute' },
  on: {
    flex: 1,
    margin: 10,
    borderRadius: 12,
    borderWidth: 4,
    borderColor: colors.accent,
    backgroundColor: 'rgba(255,116,13,0.22)',
  },
})
