import { useEffect, useState } from 'react'
import { BackHandler, StatusBar, StyleSheet, Text, View } from 'react-native'
import { isKioskAvailable, startScreenPinning } from './kiosk'
import { useGameState } from './persistence'

export default function App() {
  const { state, ready } = useGameState()
  const [pinError, setPinError] = useState<string | null>(null)
  const [pinned, setPinned] = useState(false)

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
      <Text style={styles.title}>Débriefing</Text>
      <Text style={styles.subtitle}>Game Master</Text>
      <Text style={styles.placeholder}>
        {state.teamId === null
          ? 'aucune session active'
          : `équipe ${state.teamId} · étape ${state.currentStep} · score ${state.score}`}
      </Text>
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
    paddingHorizontal: 24,
  },
  title: {
    color: '#e6d4ad',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 1.8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#8a9499',
    fontSize: 12,
    marginTop: 4,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  placeholder: {
    color: '#8a9499',
    fontSize: 12,
    marginTop: 16,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  error: {
    color: '#ff9090',
    fontSize: 12,
    marginTop: 32,
    textAlign: 'center',
    lineHeight: 18,
  },
  ok: {
    color: '#7ee2a8',
    fontSize: 12,
    marginTop: 32,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
})
