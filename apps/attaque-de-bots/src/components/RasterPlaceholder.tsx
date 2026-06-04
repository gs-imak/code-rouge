import type { JSX } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { View } from 'react-native'
import { colors } from '../theme/tokens'
import { isBgNoneHarness } from './harness'

// A stand-in for an inline licensed raster the graphiste delivers later (e.g. the
// Choix card photos) — a neutral dark fill at the maquette rect (immutable rule #3).
// Renders transparent under the `?bg=none` harness flag so the foreground-diff
// measures only the built UI (frame/title), not the placeholder-vs-photo difference.
export function RasterPlaceholder({ style }: { readonly style: StyleProp<ViewStyle> }): JSX.Element {
  return <View style={[style, { backgroundColor: isBgNoneHarness() ? 'transparent' : colors.imagePlaceholder }]} />
}
