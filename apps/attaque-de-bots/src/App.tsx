import { useEffect, useState } from 'react'
import { BackHandler, StatusBar, StyleSheet, Text, View } from 'react-native'
import { isKioskAvailable, startScreenPinning } from './kiosk'

export default function App() {
  const [pinned, setPinned] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Disable the hardware Back button at the root. Per the RN docs returning
  // `true` from the handler signals "we handled it" → Android stops here.
  //
  // KNOWN: this unconditionally swallows every Back press. Fine for chantier
  // 04 (single placeholder screen). Chantier 05 — when React Navigation
  // lands — must change this to `() => !navigationRef.current?.canGoBack()`
  // so the navigator can pop screens before we swallow at the root.
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
        // KioskNotAvailableError extends Error, so this single arm covers it.
        setError(err instanceof Error ? err.message : String(err)),
      )
  }, [])

  return (
    <View style={styles.screen}>
      <StatusBar hidden />
      <Text style={styles.title}>Connexion équipe</Text>
      <Text style={styles.placeholder}>placeholder — chantier 04</Text>
      {error !== null && <Text style={styles.error}>⚠ {error}</Text>}
      {pinned && <Text style={styles.ok}>✓ kiosk mode active</Text>}
    </View>
  )
}

// Placeholder palette only — final tokens land via @code-rouge/design-system.
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
    color: '#5a6469',
    fontSize: 14,
    marginTop: 16,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  error: {
    // Tuned to ~5.9:1 AA contrast on the #0a0d12 background (was #ff6b6b at 3.75:1).
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
