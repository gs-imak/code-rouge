import type { JSX } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme/tokens'
import { HudHeader } from '../components/HudHeader'
import { MailCard } from '../components/MailCard'
import { ScreenBackground } from '../components/ScreenBackground'
import { ScreenTitle } from '../components/ScreenTitle'
import toolL from '../assets/mail-toolL.png'
import toolR from '../assets/mail-toolR.png'
import tab from '../assets/mail-tab.png'

// « Boite Mails » (maquette frame 1:1287): the inbox. Gmail-mimic list inside the
// shared MailCard. The three rows are the maquette placeholders (« Expediteur » /
// « Objet du mail ... ») — they become the data-driven mail list (incl. the piégé
// phishing item) from mailbox.json at wiring time. Toolbars + tab are static chrome
// PNGs; rows are real components. All px = maquette coords.

// Maquette: row0 is the read/white row (bold subject), rows 1-2 are unread (#f2f5fc).
type Row = { readonly top: number; readonly bg: string; readonly check: string; readonly text: string; readonly objet: '400' | '700'; readonly date: string }
const ROWS: readonly Row[] = [
  { top: 537, bg: colors.mailContent, check: colors.mailCheck, text: colors.mailText, objet: '700', date: 'Jan, 26' },
  { top: 618, bg: colors.mailRowUnread, check: colors.mailCheckMuted, text: colors.mailTextMuted, objet: '400', date: 'March, 26' },
  { top: 699, bg: colors.mailRowUnread, check: colors.mailCheckMuted, text: colors.mailTextMuted, objet: '400', date: 'March, 26' },
]

function MailRow({ top, bg, check, text, objet, date }: Row): JSX.Element {
  return (
    <>
      <View style={[styles.row, { top, backgroundColor: bg }]} />
      <View style={[styles.rowCheck, { top: top + 30, borderColor: check }]} />
      <Text style={[styles.rowSender, { top: top + 29, color: text }]}>Expediteur</Text>
      <Text style={[styles.rowObjet, { top: top + 29, color: text, fontWeight: objet }]} numberOfLines={1}>
        Objet du mail ...
      </Text>
      <Text style={[styles.rowDate, { top: top + 31 }]}>{date}</Text>
    </>
  )
}

export function BoiteMailsScreen(): JSX.Element {
  return (
    <>
      <ScreenBackground />
      <HudHeader />
      <ScreenTitle>Mails</ScreenTitle>
      <MailCard>
        {/* White list area (maquette « Email Background » [275,396 1372×546]). */}
        <View style={styles.content} />
        <Image source={toolL} style={styles.toolL} resizeMode="contain" />
        <Image source={toolR} style={styles.toolR} resizeMode="contain" />
        <Image source={tab} style={styles.tab} resizeMode="contain" />
        {/* Tab baseline divider (maquette « Line 2 » [287,528 1329] #e0e0e0). */}
        <View style={styles.tabDivider} />
        {ROWS.map((r) => (
          <MailRow key={r.top} {...r} />
        ))}
      </MailCard>
    </>
  )
}

const styles = StyleSheet.create({
  content: { position: 'absolute', left: 275, top: 396, width: 1372, height: 546, backgroundColor: colors.mailContent, borderRadius: 23 },
  toolL: { position: 'absolute', left: 303, top: 420, width: 147, height: 20 },
  toolR: { position: 'absolute', left: 1428, top: 416, width: 203, height: 34 },
  tab: { position: 'absolute', left: 287, top: 487, width: 320, height: 41 },
  tabDivider: { position: 'absolute', left: 287, top: 528, width: 1329, height: 3, backgroundColor: colors.mailDivider },
  row: { position: 'absolute', left: 275, width: 1372, height: 81, borderWidth: 1.5, borderColor: colors.mailDivider },
  rowCheck: { position: 'absolute', left: 298, width: 20, height: 20, borderWidth: 2, borderRadius: 2 },
  rowSender: { position: 'absolute', left: 379, width: 222, fontFamily: 'Roboto', fontSize: 20, fontWeight: '500' },
  rowObjet: { position: 'absolute', left: 601, width: 860, fontFamily: 'Roboto', fontSize: 20 },
  rowDate: { position: 'absolute', left: 1468, width: 140, color: colors.mailDate, fontFamily: 'Roboto', fontSize: 15 },
})
