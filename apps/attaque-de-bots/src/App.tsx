import { useEffect, useMemo } from 'react'
import { BackHandler, Platform, StatusBar, StyleSheet, View } from 'react-native'
import { isKioskAvailable, startScreenPinning } from './kiosk'
import { useGameState } from './persistence'
import { useServerSync } from './sync'
import { SERVER_WS_URL } from './config'
import { MAILBOX, PARCOURS } from './content'
import { colors } from './theme/tokens'
import { FlowRunner } from './navigation/FlowRunner'
import { useFlow } from './navigation/useFlow'
import type { RunnerCtx } from './navigation/screen-registry'

// Attaque de Bots root. Replaces the M1 team-select skeleton: the data-driven
// flow engine renders the real 41-screen sequence (connexion → accueil → tuto →
// choix → énigme chain incl. mailbox/phishing → fin), restoring the exact screen
// on boot (immutable rule #4) and syncing progress to the NUC.
export default function App() {
  const { state, setState, getLatest, ready } = useGameState()
  const { pushState, pushLog } = useServerSync({ url: SERVER_WS_URL, state, setState, ready })
  const { view, ready: flowReady, dispatch, submitTeam } = useFlow({
    config: PARCOURS,
    ready,
    getGameState: getLatest,
    setGameState: setState,
    pushLog,
  })

  // Kiosk back button: inside a mailbox, BACK closes the open mail; everywhere
  // else it is swallowed so the player cannot leave the flow (immutable rule #1).
  useEffect(() => {
    // BackHandler is native-only (the web harness has no hardware back).
    if (Platform.OS === 'web') return undefined
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      dispatch({ type: 'BACK' })
      return true
    })
    return () => sub.remove()
  }, [dispatch])

  // Screen Pinning. In production the device is provisioned device-owner (pinning
  // is persistent); in dev without it the call is best-effort.
  useEffect(() => {
    if (!isKioskAvailable) return
    startScreenPinning().catch(() => {})
  }, [])

  // Push a snapshot to the NUC whenever committed progress changes (runs after
  // render so teamId/currentStep/score are fresh). One push per transition —
  // low-volume, within the WS remit (immutable rule #5).
  useEffect(() => {
    if (!ready || state.teamId === null) return
    pushState()
  }, [ready, state.teamId, state.currentStep, state.score, pushState])

  const ctx = useMemo<RunnerCtx>(
    () => ({ dispatch, onSubmitTeam: submitTeam, mails: MAILBOX.mails }),
    [dispatch, submitTeam],
  )

  if (!ready || !flowReady) {
    return (
      <View style={styles.boot}>
        <StatusBar hidden />
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <FlowRunner view={view} ctx={ctx} />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDeep },
  boot: { flex: 1, backgroundColor: colors.bgDeep },
})
