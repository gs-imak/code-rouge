import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BackHandler,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { isKioskAvailable, startScreenPinning } from './kiosk'
import { useGameState } from './persistence'
import { useServerSync } from './sync'
import { SERVER_WS_URL } from './config'

const APP_NAME = 'attaque-de-bots'

const NEXT_STEP: Record<string, string> = {
  init: 'phishing',
  phishing: 'mailbox',
  mailbox: 'firewall',
  firewall: 'final',
  final: 'final',
}

export default function App() {
  const { state, setState, ready } = useGameState()
  const { connection, pushState } = useServerSync({
    url: SERVER_WS_URL,
    state,
    setState,
    ready,
  })
  const [pinError, setPinError] = useState<string | null>(null)
  const [pinned, setPinned] = useState(false)
  const [draft, setDraft] = useState('')

  // KNOWN: see chantier 04 review fix — once React Navigation lands,
  // condition this on `!navigationRef.current?.canGoBack()`.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true)
    return () => sub.remove()
  }, [])

  useEffect(() => {
    if (!isKioskAvailable) {
      setPinError(
        'Kiosk module not linked — run a debug build with the Java/Kotlin sources in android/app/src/main/java/.../',
      )
      return
    }
    startScreenPinning()
      .then(() => setPinned(true))
      .catch((err: unknown) => setPinError(err instanceof Error ? err.message : String(err)))
  }, [])

  const onSubmitTeam = useCallback(async () => {
    const parsed = Number.parseInt(draft, 10)
    if (!Number.isInteger(parsed) || parsed < 0) return
    await setState({
      ...state,
      teamId: parsed,
      currentStep: state.currentStep === 'init' ? 'phishing' : state.currentStep,
      lastSync: Date.now(),
    })
    setDraft('')
    pushState()
  }, [draft, setState, state, pushState])

  const onStepForward = useCallback(async () => {
    const nextStep = NEXT_STEP[state.currentStep] ?? state.currentStep
    await setState({ ...state, currentStep: nextStep, lastSync: Date.now() })
    pushState()
  }, [setState, state, pushState])

  const headline = useMemo(() => {
    if (!ready) return ''
    if (state.teamId === null) return 'Connexion équipe'
    return `Équipe ${state.teamId}`
  }, [ready, state.teamId])

  if (!ready) {
    return (
      <View style={styles.screen}>
        <StatusBar hidden />
      </View>
    )
  }

  return (
    <View style={styles.screen}>
      <StatusBar hidden />
      <Text style={styles.title}>{headline}</Text>
      <Text style={styles.placeholder}>
        {APP_NAME} · étape : {state.currentStep} · score : {state.score}
      </Text>

      {state.teamId === null ? (
        <View style={styles.teamSelect}>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={draft}
            onChangeText={setDraft}
            placeholder="ID équipe"
            placeholderTextColor="#5a6469"
            accessibilityLabel="Identifiant d'équipe"
          />
          <Pressable
            accessibilityRole="button"
            onPress={onSubmitTeam}
            disabled={draft.length === 0}
            style={({ pressed }) => [
              styles.button,
              draft.length === 0 && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonText}>Valider</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={onStepForward}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>Étape suivante</Text>
        </Pressable>
      )}

      <View style={styles.diagnostic} accessibilityLiveRegion="polite">
        <Text style={[styles.dot, connection === 'connected' && styles.dotOk]}>
          {connection === 'connected' ? '●' : connection === 'connecting' ? '◐' : '○'}
        </Text>
        <Text style={styles.diagnosticLabel}>
          {connection === 'connected'
            ? 'NUC connecté'
            : connection === 'connecting'
              ? 'NUC connexion…'
              : 'NUC hors-ligne'}
        </Text>
      </View>

      {pinError !== null && <Text style={styles.error}>⚠ {pinError}</Text>}
      {pinned && <Text style={styles.ok}>✓ kiosk mode active</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0d12',
    padding: 32,
  },
  title: {
    color: '#e6d4ad',
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 2.4,
    textAlign: 'center',
  },
  placeholder: {
    color: '#8a9499',
    fontSize: 14,
    marginTop: 16,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  teamSelect: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
    alignItems: 'center',
  },
  input: {
    minWidth: 160,
    minHeight: 48,
    borderWidth: 2,
    borderColor: '#e6d4ad',
    color: '#e6d4ad',
    fontSize: 24,
    paddingHorizontal: 16,
    textAlign: 'center',
    letterSpacing: 4,
  },
  button: {
    minHeight: 48,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#e6d4ad',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonPressed: { backgroundColor: '#cfbe96' },
  buttonText: {
    color: '#0a0d12',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  diagnostic: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
  },
  dot: { color: '#ff9090', fontSize: 16 },
  dotOk: { color: '#7ee2a8' },
  diagnosticLabel: {
    color: '#8a9499',
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  error: {
    color: '#ff9090',
    fontSize: 14,
    marginTop: 32,
    textAlign: 'center',
    lineHeight: 20,
  },
  ok: {
    color: '#7ee2a8',
    fontSize: 14,
    marginTop: 32,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
})
