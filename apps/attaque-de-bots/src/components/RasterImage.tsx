import type { JSX } from 'react'
import { Image, type ImageSourcePropType, type ImageStyle, type StyleProp } from 'react-native'
import { isBgNoneHarness } from './harness'

// A bundled raster (a Figma photo fill — card photo, scene, code-rain) that renders
// normally in the app but goes transparent under the `?bg=none` harness flag, so the
// foreground-diff tool measures only the non-photo foreground (HUD, panels, text):
// the photo-vs-photo area cancels in the composite instead of inflating the % with
// crop/compression noise. The full-frame screen background uses ScreenBackground;
// this is for in-content rasters.
export function RasterImage({
  source,
  style,
  resizeMode = 'cover',
}: {
  readonly source: ImageSourcePropType
  readonly style?: StyleProp<ImageStyle>
  readonly resizeMode?: 'cover' | 'contain' | 'stretch'
}): JSX.Element | null {
  if (isBgNoneHarness()) return null
  return <Image source={source} style={style} resizeMode={resizeMode} />
}
