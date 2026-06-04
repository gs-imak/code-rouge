import type { JSX } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme/tokens'
import { HudHeader } from '../components/HudHeader'
import { PrimaryButton } from '../components/PrimaryButton'
import { RasterPlaceholder } from '../components/RasterPlaceholder'
import { ScreenBackground } from '../components/ScreenBackground'

// « Choix » (maquette frames 1:345 = 2 cards, 61:23581 = 3 cards): the player picks
// which bot attack to counter. The card count and their order come from the parcours
// A/B/C/D matrix (parcours.json) at runtime — never hardcode the order. Here the
// caller passes the card set so the Gallery can render both maquette variants; the
// real screen will map the parcours config to this same `cards` prop.
export type ChoixCard = {
  /** Stable énigme identifier (the parcours config key) — used as the React key,
   *  never a layout coord (panel positions can collide across A/B/C/D variants). */
  readonly id: string
  /** Card panel left edge in maquette px (image = +21, both 555 / 513 wide). */
  readonly panelLeft: number
  readonly title: string
  /** Title text box (maquette sizes the box to the text, centred on the card). */
  readonly titleLeft: number
  readonly titleWidth: number
}

// Maquette 1:345 — two cards centred (panel 555, gap 60).
export const CARDS_2: readonly ChoixCard[] = [
  { id: 'telephonie', panelLeft: 375, title: 'Attaque du système de téléphonie', titleLeft: 427, titleWidth: 452 },
  { id: 'reseau', panelLeft: 990, title: 'Déconnexion du réseau', titleLeft: 990, titleWidth: 555 },
]

// Maquette 61:23581 — three cards (panel 555, gap 40).
export const CARDS_3: readonly ChoixCard[] = [
  { id: 'telephonie', panelLeft: 87, title: 'Attaque du système de téléphonie', titleLeft: 139, titleWidth: 452 },
  { id: 'reseau', panelLeft: 682, title: 'Déconnexion du réseau', titleLeft: 682, titleWidth: 555 },
  { id: 'placeholder', panelLeft: 1277, title: 'Lorem ipsum', titleLeft: 1278, titleWidth: 555 },
]

function Card({ panelLeft, title, titleLeft, titleWidth }: ChoixCard): JSX.Element {
  return (
    <>
      {/* Panel (maquette « Rectangle 9220/9222 » 555×531 #000@20% 2px white@50% r20). */}
      <View style={[styles.cardPanel, { left: panelLeft }]} />
      {/* Image placeholder (maquette 513×351 raster — not bundled, rule #3). */}
      <RasterPlaceholder style={[styles.cardImage, { left: panelLeft + 21 }]} />
      {/* Title (maquette 36px/700 centre, textCase UPPER). */}
      <Text style={[styles.cardTitle, { left: titleLeft, width: titleWidth }]}>{title}</Text>
    </>
  )
}

export function ChoixScreen({ cards }: { readonly cards: readonly ChoixCard[] }): JSX.Element {
  return (
    <>
      <ScreenBackground />
      <HudHeader />
      <Text style={styles.title}>Choisissez l’attaque de Bots que vous souhaitez contrer</Text>
      {cards.map((c) => (
        <Card key={c.id} {...c} />
      ))}
      <PrimaryButton label="C’est partie !" top={1047} />
    </>
  )
}

const styles = StyleSheet.create({
  // Title (maquette [243,212 1434×133] 70px/700 centre, textCase UPPER, 2 lines).
  title: {
    position: 'absolute',
    left: 243,
    top: 205,
    width: 1434,
    textAlign: 'center',
    textTransform: 'uppercase',
    color: colors.white,
    fontFamily: 'Roboto',
    fontSize: 70,
    fontWeight: '700',
    lineHeight: 80,
  },
  cardPanel: {
    position: 'absolute',
    top: 424,
    width: 555,
    height: 531,
    backgroundColor: colors.panelCard,
    borderWidth: 2,
    borderColor: colors.panelStroke,
    borderRadius: 20,
  },
  cardImage: {
    position: 'absolute',
    top: 443,
    width: 513,
    height: 351,
    borderRadius: 20,
  },
  cardTitle: {
    position: 'absolute',
    top: 832,
    textAlign: 'center',
    textTransform: 'uppercase',
    color: colors.white,
    fontFamily: 'Roboto',
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 42,
  },
})
