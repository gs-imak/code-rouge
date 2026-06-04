import type { JSX, ReactNode } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme/tokens'
import search from '../assets/mail-search.png'

// Shared Gmail-mimic mailbox card (maquette « Boite Mails » / « Mails »): the light
// panel + hamburger + « Vos mail » heading + the search bar, common to both mailbox
// screens. The body (inbox list vs opened email) is passed as children. Static Gmail
// chrome (search bar, toolbars, action icons) is exported from Figma as PNG and
// placed at exact px; the dynamic parts (rows, email content) are real components
// the children supply, to be wired to mailbox.json later. All px = maquette coords.
export function MailCard({ children }: { readonly children: ReactNode }): JSX.Element {
  return (
    <>
      {/* Panel (maquette « Rectangle 9220 » [236,181 1449×856] #f7f8fc r20). */}
      <View style={styles.panel} />
      {/* Hamburger menu (maquette « Gmail Logo & Menu », approximated by 3 bars). */}
      <View style={[styles.burger, { top: 232 }]} />
      <View style={[styles.burger, { top: 240 }]} />
      <View style={[styles.burger, { top: 248 }]} />
      {/* « Vos mail » heading (maquette [349,218 116×40] 29px/700). */}
      <Text style={styles.vosMail}>Vos mail</Text>
      {/* Search bar (maquette « Search Bar » [275,289 1372×67], static chrome PNG). */}
      <Image source={search} style={styles.search} resizeMode="contain" />
      {children}
    </>
  )
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    left: 236,
    top: 181,
    width: 1449,
    height: 856,
    backgroundColor: colors.mailPanel,
    borderWidth: 2,
    borderColor: colors.panelStroke,
    borderRadius: 20,
  },
  burger: { position: 'absolute', left: 287, width: 24, height: 3, borderRadius: 1, backgroundColor: colors.mailHeading },
  vosMail: {
    position: 'absolute',
    left: 349,
    top: 218,
    width: 200,
    color: colors.mailHeading,
    fontFamily: 'Roboto',
    fontSize: 29,
    fontWeight: '700',
    lineHeight: 40,
  },
  search: { position: 'absolute', left: 275, top: 289, width: 1372, height: 67 },
})
