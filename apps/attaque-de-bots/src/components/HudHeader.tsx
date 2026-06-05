import type { JSX } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme/tokens'
import { useHud } from '../navigation/HudContext'
import logo from '../assets/section13-logo-header.png'
import email from '../assets/icon-email.png'
import stopwatch from '../assets/icon-stopwatch.png'
import gaugeTrack from '../assets/grad-gauge-track.png'
import gaugeFill from '../assets/grad-gauge-fill.png'
import timerDot from '../assets/grad-timer-dot.png'

// Shared HUD bar (maquette « Header » instance, 1920×87) sitting at the top of the
// énigme / Choix / Tuto screens: SECTION13 logo + mail-notification icon (left),
// the score gauge « 320pt » and stopwatch « 10:05 » timer (right), over a bottom
// divider. Score + timer are props so the live game state can drive them; they
// default to the maquette values so the static pixel-diff matches. The gauge track,
// fill and timer dot are vertical-gradient textures (maquette « Jauge » / « Ellipse
// 308 ») — generated static-PNG fills, no native gradient dependency. Children are
// absolutely positioned at exact maquette px inside the 1920×1200 canvas.
export function HudHeader({
  score,
  timer,
}: {
  readonly score?: string
  readonly timer?: string
} = {}): JSX.Element {
  // Live values come from the FlowRunner via context; an explicit prop still wins,
  // and the maquette defaults apply in the dev Gallery (no provider) so the static
  // pixel-diff is unchanged.
  const hud = useHud()
  const scoreValue = score ?? hud.score ?? '320'
  const timerValue = timer ?? hud.timer ?? '10:05'
  return (
    <>
      {/* Timer box fill (maquette « Rectangle 9226 » [1681,0 239×87] white@17%). */}
      <View style={styles.timerBox} />
      {/* Bottom divider (maquette « Line 23 » [34,87 1633] white@30% ~2.67px). */}
      <View style={styles.divider} />
      {/* SECTION13 logo lockup (maquette « logo » [27,15 242×58]). */}
      <Image source={logo} style={styles.logo} resizeMode="contain" />
      {/* Mail / notifications icon (maquette « Email 1 » [266,-10 100×100], white). */}
      <Image source={email} style={styles.email} resizeMode="contain" />
      {/* Score gauge track + fill (maquette « Jauge » [1258,29 264×27] / [1263,32 109×20]). */}
      <Image source={gaugeTrack} style={styles.jaugeTrack} resizeMode="stretch" />
      <Image source={gaugeFill} style={styles.jaugeFill} resizeMode="stretch" />
      {/* « 320pt » (maquette [1537,4] 53px/700, « pt » smaller). */}
      <Text style={styles.score}>
        {scoreValue}
        <Text style={styles.scorePt}>pt</Text>
      </Text>
      {/* Stopwatch glyph over a gradient dot (maquette « Ellipse 308 » + « stopwatch 1 »). */}
      <Image source={timerDot} style={styles.timerDot} resizeMode="stretch" />
      <Image source={stopwatch} style={styles.stopwatch} resizeMode="contain" />
      {/* « 10:05 » (maquette « Timer » [1759,4 136×83] 45px/600 centre). */}
      <Text style={styles.timer}>{timerValue}</Text>
    </>
  )
}

const styles = StyleSheet.create({
  timerBox: { position: 'absolute', left: 1681, top: 0, width: 239, height: 87, backgroundColor: colors.timerBox },
  divider: { position: 'absolute', left: 34, top: 86, width: 1633, height: 3, backgroundColor: colors.divider },
  logo: { position: 'absolute', left: 27, top: 15, width: 242, height: 58 },
  email: { position: 'absolute', left: 266, top: -10, width: 100, height: 100, tintColor: colors.white },
  jaugeTrack: { position: 'absolute', left: 1258, top: 29, width: 264, height: 27, borderRadius: 13.5, borderWidth: 2.67, borderColor: colors.jaugeStroke },
  jaugeFill: { position: 'absolute', left: 1263, top: 32, width: 109, height: 20, borderRadius: 10 },
  score: { position: 'absolute', left: 1537, top: 11, width: 160, color: colors.white, fontFamily: 'Roboto', fontSize: 53, fontWeight: '700' },
  scorePt: { fontSize: 26, fontWeight: '700' },
  timerDot: { position: 'absolute', left: 1714, top: 30, width: 35, height: 34, borderRadius: 17 },
  stopwatch: { position: 'absolute', left: 1703, top: 14, width: 59, height: 59 },
  timer: {
    position: 'absolute',
    left: 1759,
    top: 18,
    width: 136,
    textAlign: 'center',
    color: colors.white,
    fontFamily: 'Roboto',
    fontSize: 45,
    fontWeight: '600',
  },
})
