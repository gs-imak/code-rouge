import type { JSX } from 'react'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import type { MailboxMail } from '@code-rouge/shared-types'
import { colors } from '../theme/tokens'
import { HudHeader } from '../components/HudHeader'
import { MailCard } from '../components/MailCard'
import { PrimaryButton } from '../components/PrimaryButton'
import { ScreenBackground } from '../components/ScreenBackground'
import { ScreenTitle } from '../components/ScreenTitle'
import type { MailboxInboxProps } from '../navigation/types'
import toolL from '../assets/mail-toolL.png'
import toolR from '../assets/mail-toolR.png'
import tab from '../assets/mail-tab.png'

// « Boite Mails » (maquette frame 1:1287): the inbox. With no `mails` (dev Gallery)
// it renders the three static maquette placeholder rows for the pixel-diff; in the
// running app the rows are the real mailbox.json mails — each tappable, and clicking
// the piégé one fires the phishing trap (logged for scoring). A Continuer advances
// past the mailbox step (placeholder mechanic — Nathanael confirms the real exit).

const ROW_TOP0 = 537
const ROW_H = 81

// --- Static maquette rows (Gallery / pixel-diff) ---
type Row = { readonly top: number; readonly bg: string; readonly check: string; readonly text: string; readonly objet: '400' | '700'; readonly date: string }
const ROWS: readonly Row[] = [
  { top: ROW_TOP0, bg: colors.mailContent, check: colors.mailCheck, text: colors.mailText, objet: '700', date: 'Jan, 26' },
  { top: ROW_TOP0 + ROW_H, bg: colors.mailRowUnread, check: colors.mailCheckMuted, text: colors.mailTextMuted, objet: '400', date: 'March, 26' },
  { top: ROW_TOP0 + ROW_H * 2, bg: colors.mailRowUnread, check: colors.mailCheckMuted, text: colors.mailTextMuted, objet: '400', date: 'March, 26' },
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

// --- Data-driven interactive rows (running app) ---
function DynamicMailRow({
  mail,
  index,
  onOpen,
}: {
  readonly mail: MailboxMail
  readonly index: number
  readonly onOpen?: (id: string, phishing: boolean) => void
}): JSX.Element {
  const top = ROW_TOP0 + index * ROW_H
  const read = index === 0
  const bg = read ? colors.mailContent : colors.mailRowUnread
  const text = read ? colors.mailText : colors.mailTextMuted
  const check = read ? colors.mailCheck : colors.mailCheckMuted
  return (
    <>
      <View style={[styles.row, { top, backgroundColor: bg }]} />
      <View style={[styles.rowCheck, { top: top + 30, borderColor: check }]} />
      <Text style={[styles.rowSender, { top: top + 29, color: text }]} numberOfLines={1}>
        {mail.from}
      </Text>
      <Text
        style={[styles.rowObjet, { top: top + 29, color: text, fontWeight: read ? '700' : '400' }]}
        numberOfLines={1}
      >
        {mail.subject}
      </Text>
      {/* Transparent hit target over the whole row (the trap isn't visually flagged). */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={mail.subject}
        onPress={() => onOpen?.(mail.id, mail.phishing)}
        style={[styles.rowHit, { top }]}
      />
    </>
  )
}

export function BoiteMailsScreen({ mails, onOpenMail, onContinue }: MailboxInboxProps = {}): JSX.Element {
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
        {mails === undefined
          ? ROWS.map((r) => <MailRow key={r.top} {...r} />)
          : mails.slice(0, 5).map((mail, i) => (
              <DynamicMailRow key={mail.id} mail={mail} index={i} onOpen={onOpenMail} />
            ))}
      </MailCard>
      {onContinue ? <PrimaryButton label="Continuer" top={1082} left={791} onPress={onContinue} /> : null}
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
  rowHit: { position: 'absolute', left: 275, width: 1372, height: 81 },
})
