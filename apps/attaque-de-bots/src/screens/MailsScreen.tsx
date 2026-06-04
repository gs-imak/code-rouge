import type { JSX } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme/tokens'
import { HudHeader } from '../components/HudHeader'
import { MailCard } from '../components/MailCard'
import { PrimaryButton } from '../components/PrimaryButton'
import { ScreenBackground } from '../components/ScreenBackground'
import { ScreenTitle } from '../components/ScreenTitle'
import type { MailReadingProps } from '../navigation/types'
import actions from '../assets/mail-actions.png'
import avatar from '../assets/mail-avatar.png'
import star from '../assets/mail-star.png'
import reply from '../assets/mail-reply.png'
import forward from '../assets/mail-forward.png'

// « Mails » (maquette frame 1:1292): an opened email. With no `mail` (dev Gallery) it
// shows the maquette placeholders; in the running app it shows the selected mail's
// subject / sender / body, plus a Retour button (the hardware back also closes it).
// The Gmail chrome (action icons, avatar, reply/forward) stays static art.
export function MailsScreen({ mail, onBack }: MailReadingProps = {}): JSX.Element {
  return (
    <>
      <ScreenBackground />
      <HudHeader />
      <ScreenTitle>Mails</ScreenTitle>
      <MailCard>
        {/* White content area (maquette « Email Background » [275,396 1372×592]). */}
        <View style={styles.content} />
        <Image source={actions} style={styles.actions} resizeMode="contain" />
        <Text style={styles.subject} numberOfLines={1}>
          {mail?.subject ?? 'Titre de l’email'}
        </Text>
        <Image source={avatar} style={styles.avatar} resizeMode="contain" />
        <Text style={styles.sender} numberOfLines={1}>
          {mail?.from ?? 'Nom du destinataire'} <Text style={styles.senderMail}>{'<randomdesign@gmail.com>'}</Text>
        </Text>
        <Text style={styles.tome}>to me</Text>
        <Image source={star} style={styles.star} resizeMode="contain" />
        <Text style={styles.body}>{mail?.body ?? 'Message de l’email ...'}</Text>
        <Image source={reply} style={styles.reply} resizeMode="contain" />
        <Image source={forward} style={styles.forward} resizeMode="contain" />
        {onBack ? <PrimaryButton label="Retour" top={1082} left={791} onPress={onBack} /> : null}
      </MailCard>
    </>
  )
}

const styles = StyleSheet.create({
  content: { position: 'absolute', left: 275, top: 396, width: 1372, height: 592, backgroundColor: colors.mailContent, borderRadius: 23 },
  actions: { position: 'absolute', left: 304, top: 424, width: 524, height: 18 },
  // Subject (maquette [377,487] 23px/400 #313234) — box widened past the maquette's
  // tight 156px so the placeholder doesn't clip.
  subject: { position: 'absolute', left: 377, top: 487, width: 600, color: '#313234', fontFamily: 'Roboto', fontSize: 23 },
  avatar: { position: 'absolute', left: 304, top: 549, width: 53, height: 53 },
  // Sender (maquette [377,552] 19.2px/700 #353638) — name bold, address muted.
  sender: { position: 'absolute', left: 377, top: 552, width: 900, color: '#353638', fontFamily: 'Roboto', fontSize: 19, fontWeight: '700' },
  senderMail: { color: colors.mailTextMuted, fontSize: 15, fontWeight: '400' },
  tome: { position: 'absolute', left: 377, top: 580, width: 200, color: '#818488', fontFamily: 'Roboto', fontSize: 15, fontWeight: '500' },
  star: { position: 'absolute', left: 1514, top: 578, width: 92, height: 18 },
  body: { position: 'absolute', left: 377, top: 644, width: 800, color: '#535456', fontFamily: 'Roboto', fontSize: 18 },
  reply: { position: 'absolute', left: 381, top: 910, width: 157, height: 44 },
  forward: { position: 'absolute', left: 554, top: 910, width: 164, height: 44 },
})
