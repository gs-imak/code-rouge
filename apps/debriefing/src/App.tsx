import { useEffect, useState } from 'react'
import { BackHandler, StatusBar, StyleSheet, Text, View } from 'react-native'
import { isKioskAvailable, startScreenPinning } from './kiosk'

// GM-only app, portrait phone. Less immersion, more clarity than the
// player apps — but kiosk mode still required so push notifications don't
// surface during a debrief.
export default function App() {
  const [pinned, setPinned] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // KNOWN: see attaque-de-bots/App.tsx — chantier 05 must condition this
  // on `!navigationRef.current?.canGoBack()` once React Navigation lands.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true)
    return () => sub.remove()
  }, [])

  useEffect(() => {
    if (!isKioskAvailable) {
      setError(
        'Kiosk module not linked — run a debug build with the Java/Kotlin sources in android/app/src/main/java/.../',
      )
      return
    }
    startScreenPinning()
      .then(() => setPinned(true))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : String(err)),
      )
  }, [])

  return (
    <View style={styles.screen}>
      <StatusBar hidden />
      <Text style={styles.title}>Débriefing</Text>
      <Text style={styles.subtitle}>Game Master</Text>
      <Text style={styles.placeholder}>placeholder — chantier 04</Text>
      {error !== null && <Text style={styles.error}>⚠ {error}</Text>}
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
    color: '#5a6469',
    fontSize: 12,
    marginTop: 4,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  placeholder: {
    color: '#5a6469',
    fontSize: 12,
    marginTop: 16,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  error: {
    // Tuned to ~5.9:1 AA contrast on #0a0d12 (was #ff6b6b at 3.75:1).
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
