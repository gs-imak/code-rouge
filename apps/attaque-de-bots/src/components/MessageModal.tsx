import type { JSX } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme/tokens'
import chrome from '../assets/modal-chrome.png'
import close from '../assets/icon-close.png'

// The shared « Message de l'équipe de la section 13 » briefing modal shown on every
// énigme's accueil (maquette « Modal » in frame 1:361 etc.): a glowing dark card with
// a header, the énigme briefing, a close cross and an OK button. The glow/border is
// the exported chrome PNG; the title + body are props (the per-énigme briefing comes
// from config later). All px = maquette coords.
export function MessageModal({
  body,
  title = 'Message de l’équipe de la section 13',
}: {
  readonly body: string
  readonly title?: string
}): JSX.Element {
  return (
    <>
      <Image source={chrome} style={styles.chrome} resizeMode="contain" />
      <Text style={styles.title}>{title}</Text>
      <Image source={close} style={styles.close} resizeMode="contain" />
      <Text style={styles.body}>{body}</Text>
      <View style={styles.okBtn} />
      <Text style={styles.okLabel}>OK</Text>
    </>
  )
}

const styles = StyleSheet.create({
  // The exported chrome PNG (2839×2010) includes the outer glow, so it is larger than
  // the 1163×729 content box. Place it at full design size (img/2) centred on the
  // content centre (959.5,625.5) so the box + title strip land at their Figma px.
  chrome: { position: 'absolute', left: 250, top: 123, width: 1419.5, height: 1005 },
  // (maquette [461,293 999×94] 46px/700 centre, textCase UPPER).
  title: {
    position: 'absolute',
    left: 461,
    top: 293,
    width: 999,
    textAlign: 'center',
    textTransform: 'uppercase',
    color: colors.white,
    fontFamily: 'Roboto',
    fontSize: 46,
    fontWeight: '700',
    lineHeight: 94,
  },
  close: { position: 'absolute', left: 1476, top: 293, width: 32, height: 32 },
  // (maquette [527,512 850×229] 36px/500 centre).
  body: {
    position: 'absolute',
    left: 527,
    top: 512,
    width: 850,
    textAlign: 'center',
    color: colors.white,
    fontFamily: 'Roboto',
    fontSize: 36,
    fontWeight: '500',
    lineHeight: 47,
  },
  // OK button (maquette « Buttom » [836,757 250×75] orange, 37.8px/700).
  okBtn: { position: 'absolute', left: 836, top: 757, width: 250, height: 75, backgroundColor: colors.accent, borderRadius: 20 },
  okLabel: { position: 'absolute', left: 836, top: 775, width: 250, textAlign: 'center', color: colors.white, fontFamily: 'Roboto', fontSize: 38, fontWeight: '700' },
})
