import { useState, type JSX } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { colors } from '../theme/tokens'

// Interactive overlay that turns a static widget PNG (pattern grid, phone keypad,
// platter selector, network nodes…) into a real input. Transparent Pressables are
// laid over the widget's maquette bounding box in an R×C grid; each tap appends (or,
// in 'single' mode, replaces) that cell's token, and the joined string is emitted
// for validation against the énigme's `solution`.
//
// Hit regions are derived from the widget bbox ÷ grid — visually 1:1 with the PNG
// (which is itself laid out as a grid/keypad). Exact per-cell coordinates are a
// graphiste-confirmation follow-up; the encoding (tokens + separator) matches the
// placeholder solutions in parcours.json.
export interface TapGridProps {
  readonly left: number
  readonly top: number
  readonly width: number
  readonly height: number
  readonly rows: number
  readonly cols: number
  /** Token emitted per cell, row-major (length rows×cols). '' marks a blank cell. */
  readonly tokens: readonly string[]
  /** Joins the tapped tokens — '' for keypad digits, '-' for a path/sequence. */
  readonly separator?: string
  /** 'sequence' appends every tap; 'single' keeps only the latest. */
  readonly mode?: 'sequence' | 'single'
  /** Highlight tapped cells (path/selection) or leave the PNG untouched (keypad). */
  readonly feedback?: 'cell' | 'none'
  readonly onChange: (value: string) => void
}

export function TapGrid({
  left,
  top,
  width,
  height,
  rows,
  cols,
  tokens,
  separator = '',
  mode = 'sequence',
  feedback = 'cell',
  onChange,
}: TapGridProps): JSX.Element {
  const [seq, setSeq] = useState<readonly number[]>([])
  const cellW = width / cols
  const cellH = height / rows

  function tap(index: number): void {
    const next = mode === 'single' ? [index] : [...seq, index]
    setSeq(next)
    onChange(next.map((i) => tokens[i] ?? '').join(separator))
  }

  const cells: JSX.Element[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const index = r * cols + c
      const token = tokens[index]
      if (token === undefined || token === '') continue // skip blank cells (keypad corners)
      const selected = feedback === 'cell' && seq.includes(index)
      cells.push(
        <Pressable
          key={index}
          accessibilityRole="button"
          accessibilityLabel={token}
          onPress={() => tap(index)}
          style={[styles.cell, { left: left + c * cellW, top: top + r * cellH, width: cellW, height: cellH }]}
        >
          {selected ? <View style={styles.selected} /> : null}
        </Pressable>,
      )
    }
  }
  return <>{cells}</>
}

const styles = StyleSheet.create({
  cell: { position: 'absolute' },
  // Translucent accent ring over a tapped cell (path/selection feedback).
  selected: {
    flex: 1,
    margin: 8,
    borderRadius: 12,
    borderWidth: 4,
    borderColor: colors.accent,
    backgroundColor: 'rgba(255,116,13,0.18)',
  },
})
