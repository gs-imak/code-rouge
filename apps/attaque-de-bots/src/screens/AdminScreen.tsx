import type { JSX } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme/tokens'
import { PrimaryButton } from '../components/PrimaryButton'
import { ScreenBackground } from '../components/ScreenBackground'
import refresh from '../assets/icon-refresh.png'
import chevron from '../assets/icon-chevron.png'
import cog from '../assets/icon-cog.png'
import gradOrange from '../assets/grad-button-orange.png'
import gradTransmettre from '../assets/grad-transmettre.png'

// « Admin » (maquette frame 1:121): the game-master setup / diagnostics screen (no
// HUD). Four translucent panels — network diagnostic, hardware state, session
// control, session settings — over the bottom Transmettre / Sauvegarder actions.
// Status dots + dropdown values are maquette placeholders, wired to the server
// handshake + parcours config later. All px = maquette coords.

// A row of status dots (maquette « Ellipse 302-307 », 40×40, ~50.5px pitch): the
// first `on` are lit, the rest unlit.
function Dots({ left, top, on, total }: { readonly left: number; readonly top: number; readonly on: number; readonly total: number }): JSX.Element {
  return (
    <>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[styles.dot, i < on ? styles.dotOn : styles.dotOff, { left: left + i * 50.5, top }]} />
      ))}
    </>
  )
}

// A settings dropdown (maquette « dropdown »): label + field box + value + chevron.
function Dropdown({ left, top, value }: { readonly left: number; readonly top: number; readonly value: string }): JSX.Element {
  return (
    <>
      <View style={[styles.dropdown, { left, top }]} />
      <Text style={[styles.dropdownVal, { left: left + 28, top: top + 18 }]} numberOfLines={1}>
        {value}
      </Text>
      <Image source={chevron} style={[styles.chevron, { left: left + 431, top: top + 16 }]} resizeMode="contain" />
    </>
  )
}

export function AdminScreen(): JSX.Element {
  return (
    <>
      <ScreenBackground />
      <Text style={styles.title}>Admin et paramétrages</Text>

      {/* Panel 1 — Diagnostic réseau [190,110 626×291]. */}
      <View style={[styles.panel, { left: 190, top: 110, width: 626, height: 291 }]} />
      <Text style={[styles.panelTitle, { left: 190, top: 123, width: 626 }]}>Diagnostic réseau</Text>
      <Text style={[styles.body2, { left: 306, top: 201, width: 394 }]}>État de la connexion avec le serveur local</Text>
      <Dots left={358} top={298} on={5} total={6} />

      {/* Panel 2 — État matériel [850,110 910×291]. */}
      <View style={[styles.panel, { left: 850, top: 110, width: 910, height: 291 }]} />
      <Text style={[styles.panelTitle, { left: 850, top: 123, width: 910 }]}>État matériel</Text>
      <Text style={[styles.body1, styles.upper, { left: 945, top: 240, width: 303 }]}>Batterie</Text>
      <Dots left={945} top={298} on={3} total={6} />
      <Text style={[styles.body1, styles.upper, { left: 1364, top: 240, width: 303 }]}>Wifi</Text>
      <Dots left={1364} top={298} on={4} total={6} />

      {/* Panel 3 — Contrôle de session [190,438 626×597]. */}
      <View style={[styles.panel, { left: 190, top: 438, width: 626, height: 597 }]} />
      <Text style={[styles.panelTitle, { left: 190, top: 465, width: 626 }]}>Contrôle de session</Text>
      <Text style={[styles.body1, { left: 237, top: 580, width: 532 }]}>Réinitialiser la session de jeu :</Text>
      {/* Reset button (maquette « Buttom » [342,643 328×75] orange gradient + refresh icon). */}
      <Image source={gradOrange} style={styles.resetBtn} resizeMode="stretch" />
      <Text style={styles.resetLabel}>Reset</Text>
      <Image source={refresh} style={styles.resetIcon} resizeMode="contain" />
      <Text style={[styles.body1, { left: 238, top: 802, width: 532 }]}>Sélectionnez votre étape de jeu :</Text>
      <Dropdown left={262} top={854} value="Sélectionner une étape" />

      {/* Panel 4 — Paramétrage de session [850,438 910×597]. */}
      <View style={[styles.panel, { left: 850, top: 438, width: 910, height: 597 }]} />
      <Text style={[styles.panelTitle, { left: 850, top: 465, width: 910 }]}>Paramétrage de session</Text>
      <Text style={[styles.body1, { left: 1041, top: 568, width: 532 }]}>Sélectionnez le parcours de jeu :</Text>
      <Dropdown left={1065} top={620} value="Sélectionner un parcours" />
      <Text style={[styles.body1, { left: 1041, top: 740, width: 532 }]}>Sélectionnez l’équipe :</Text>
      <Dropdown left={1065} top={792} value="Sélectionner une équipe" />
      {/* Personnaliser button (maquette [1065,908 483×75] white outline + cog). */}
      <View style={styles.persoBtn} />
      <Text style={styles.persoLabel}>Personnaliser votre session</Text>
      <Image source={cog} style={styles.persoIcon} resizeMode="contain" />

      {/* Bottom actions. */}
      <Image source={gradTransmettre} style={styles.transmettreBtn} resizeMode="stretch" />
      <Text style={styles.transmettreLabel}>Transmettre au serveur</Text>
      <PrimaryButton label="Sauvegarder" top={1077} left={1037} />
    </>
  )
}

const styles = StyleSheet.create({
  // (maquette [757,12 405×79] 30px/700 centre, textCase UPPER).
  title: {
    position: 'absolute',
    left: 757,
    top: 12,
    width: 405,
    textAlign: 'center',
    textTransform: 'uppercase',
    color: colors.white,
    fontFamily: 'Roboto',
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 79,
  },
  panel: { position: 'absolute', backgroundColor: colors.panelCard, borderWidth: 2, borderColor: colors.panelStroke, borderRadius: 20 },
  // Panel headings (maquette 36px/700 centre, textCase UPPER) — lineHeight centres in box.
  panelTitle: {
    position: 'absolute',
    textAlign: 'center',
    textTransform: 'uppercase',
    color: colors.white,
    fontFamily: 'Roboto',
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 79,
  },
  // Single-line body label (maquette 30px/400 centre).
  body1: {
    position: 'absolute',
    textAlign: 'center',
    color: colors.white,
    fontFamily: 'Roboto',
    fontSize: 30,
    fontWeight: '400',
    letterSpacing: -0.6,
  },
  // « Batterie » / « Wifi » sub-headings render uppercase (maquette textCase UPPER).
  upper: { textTransform: 'uppercase' },
  // Two-line body (maquette 30px/400 centre, tight).
  body2: {
    position: 'absolute',
    textAlign: 'center',
    color: colors.white,
    fontFamily: 'Roboto',
    fontSize: 30,
    fontWeight: '400',
    letterSpacing: -0.6,
    lineHeight: 39,
  },
  dot: { position: 'absolute', width: 40, height: 40, borderRadius: 20, borderWidth: 2 },
  dotOn: { backgroundColor: colors.dotOn, borderColor: colors.dotOnStroke },
  dotOff: { backgroundColor: colors.dotOff, borderColor: colors.white },
  // Reset button.
  resetBtn: { position: 'absolute', left: 342, top: 643, width: 328, height: 75, borderRadius: 19.5, overflow: 'hidden' },
  resetLabel: { position: 'absolute', left: 330, top: 664, width: 340, textAlign: 'center', color: colors.white, fontFamily: 'Roboto', fontSize: 28, fontWeight: '600' },
  resetIcon: { position: 'absolute', left: 607, top: 663, width: 37, height: 34 },
  // Dropdown field.
  dropdown: { position: 'absolute', width: 484, height: 68, backgroundColor: colors.dropdownFill, borderWidth: 2, borderColor: colors.white, borderRadius: 15 },
  dropdownVal: { position: 'absolute', width: 380, color: colors.white, fontFamily: 'Roboto', fontSize: 24, fontWeight: '600' },
  chevron: { position: 'absolute', width: 37, height: 37 },
  // Personnaliser button (transparent, white outline).
  persoBtn: { position: 'absolute', left: 1065, top: 908, width: 483, height: 75, borderWidth: 1.33, borderColor: colors.white, borderRadius: 15 },
  persoLabel: { position: 'absolute', left: 1097, top: 924, width: 395, color: colors.white, fontFamily: 'Roboto', fontSize: 28, fontWeight: '600' },
  persoIcon: { position: 'absolute', left: 1490, top: 929, width: 35, height: 35 },
  // Transmettre (dark) button.
  transmettreBtn: { position: 'absolute', left: 545, top: 1077, width: 459, height: 80, borderRadius: 20, overflow: 'hidden' },
  transmettreLabel: { position: 'absolute', left: 545, top: 1093, width: 459, textAlign: 'center', color: colors.white, fontFamily: 'Roboto', fontSize: 34, fontWeight: '500' },
})
