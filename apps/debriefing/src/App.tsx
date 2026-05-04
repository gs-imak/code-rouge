import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BackHandler,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { isKioskAvailable, startScreenPinning } from './kiosk'
import { useGameState } from './persistence'
import { useServerHandshake } from './sync'
import { DEFAULT_SERVER_WS_URL } from './config'

// Débriefing — Game Master companion app. M1 squelette covers:
//   - Kiosk lock (Screen Pinning, BackHandler swallow)
//   - Network diagnostic dot
//   - Setup admin: NUC IP input (persisted), reset code field, Reset
//     button calling POST /admin/reset
//   - State summary
// Final visual layer (Laura's tokens, real GM workflow) lands in chantier 06+.

const RESET_TIMEOUT_MS = 5000

type ResetStatus =
  | { kind: 'idle' }
  | { kind: 'pending' }
  | { kind: 'success'; teamStateDeleted: number; eventLogDeleted: number }
  | { kind: 'error'; message: string }

export default function App() {
  const { state, setState, getLatest, ready } = useGameState()
  const wsUrl = useMemo(() => buildWsUrl(state.serverIp), [state.serverIp])
  const { connection } = useServerHandshake({
    url: wsUrl,
    state,
    ready,
  })
  const [pinError, setPinError] = useState<string | null>(null)
  const [pinned, setPinned] = useState(false)
  const [resetCodeDraft, setResetCodeDraft] = useState('')
  const [resetStatus, setResetStatus] = useState<ResetStatus>({ kind: 'idle' })

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

  const onServerIpChange = useCallback(
    (next: string) => {
      const trimmed = next.trim().slice(0, 64)
      const current = getLatest()
      void setState({ ...current, serverIp: trimmed === '' ? '127.0.0.1' : trimmed })
    },
    [getLatest, setState],
  )

  const onResetSession = useCallback(async () => {
    const code = resetCodeDraft.trim()
    if (code.length === 0) return
    setResetStatus({ kind: 'pending' })
    // Manual AbortController + setTimeout because AbortSignal.timeout
    // isn't typed in RN's lib.dom subset and we want consistent typing
    // across the dev surface.
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), RESET_TIMEOUT_MS)
    try {
      const res = await fetch(`http://${getLatest().serverIp}:8080/admin/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
        signal: controller.signal,
      })
      if (res.status === 200) {
        const body = (await res.json()) as {
          teamStateDeleted: number
          eventLogDeleted: number
        }
        setResetStatus({ kind: 'success', ...body })
        setResetCodeDraft('')
      } else if (res.status === 401) {
        setResetStatus({ kind: 'error', message: 'Code incorrect.' })
      } else {
        setResetStatus({
          kind: 'error',
          message: `Réponse serveur inattendue : ${res.status}`,
        })
      }
    } catch (err) {
      setResetStatus({
        kind: 'error',
        message: err instanceof Error ? err.message : String(err),
      })
    } finally {
      clearTimeout(timer)
    }
  }, [resetCodeDraft, getLatest])

  if (!ready) {
    return (
      <View style={styles.screen}>
        <StatusBar hidden />
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <StatusBar hidden />

      <View style={styles.header}>
        <Text style={styles.title}>Débriefing</Text>
        <Text style={styles.subtitle}>Game Master</Text>
      </View>

      <View style={styles.diagnostic} accessibilityLiveRegion="polite">
        <Text style={[styles.dot, connection === 'connected' && styles.dotOk]}>
          {dotGlyph(connection)}
        </Text>
        <Text style={styles.diagnosticLabel}>{dotLabel(connection)}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>État courant</Text>
        <Text style={styles.stateLine}>
          {state.teamId === null
            ? 'aucune session active'
            : `équipe ${state.teamId} · étape ${state.currentStep} · score ${state.score}`}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Setup admin</Text>

        <Text style={styles.label}>IP du NUC</Text>
        <TextInput
          style={styles.input}
          value={state.serverIp}
          onChangeText={onServerIpChange}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="127.0.0.1"
          placeholderTextColor="#5a6469"
          accessibilityLabel="IP du NUC"
        />
        <Text style={styles.hint}>port 8080 fixé · WS = ws://{state.serverIp}:8080/ws</Text>

        <Text style={[styles.label, styles.labelMargin]}>Code de reset (session)</Text>
        <TextInput
          style={styles.input}
          value={resetCodeDraft}
          onChangeText={setResetCodeDraft}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="lu sur le journal du NUC au démarrage"
          placeholderTextColor="#5a6469"
          accessibilityLabel="Code de reset"
        />
        <Pressable
          accessibilityRole="button"
          onPress={onResetSession}
          disabled={resetCodeDraft.length === 0 || resetStatus.kind === 'pending'}
          style={({ pressed }) => [
            styles.button,
            (resetCodeDraft.length === 0 || resetStatus.kind === 'pending') &&
              styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>
            {resetStatus.kind === 'pending' ? 'Reset en cours…' : 'Reset session'}
          </Text>
        </Pressable>

        {resetStatus.kind === 'success' && (
          <Text style={styles.feedbackOk}>
            ✓ session réinitialisée — {resetStatus.teamStateDeleted} états équipe + {resetStatus.eventLogDeleted} logs supprimés
          </Text>
        )}
        {resetStatus.kind === 'error' && (
          <Text style={styles.feedbackErr}>⚠ {resetStatus.message}</Text>
        )}
      </View>

      {pinError !== null && <Text style={styles.error}>⚠ {pinError}</Text>}
      {pinned && <Text style={styles.ok}>✓ kiosk mode active</Text>}
    </ScrollView>
  )
}

function buildWsUrl(serverIp: string): string {
  const ip = serverIp.trim()
  if (ip === '') return DEFAULT_SERVER_WS_URL
  return `ws://${ip}:8080/ws`
}

function dotGlyph(c: 'connected' | 'connecting' | 'disconnected'): string {
  if (c === 'connected') return '●'
  if (c === 'connecting') return '◐'
  return '○'
}

function dotLabel(c: 'connected' | 'connecting' | 'disconnected'): string {
  if (c === 'connected') return 'NUC connecté'
  if (c === 'connecting') return 'NUC connexion…'
  return 'NUC hors-ligne'
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0a0d12',
  },
  scroll: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 24,
  },
  header: {
    alignItems: 'center',
    gap: 4,
  },
  title: {
    color: '#e6d4ad',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 1.8,
  },
  subtitle: {
    color: '#8a9499',
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  diagnostic: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dot: { color: '#ff9090', fontSize: 16 },
  dotOk: { color: '#7ee2a8' },
  diagnosticLabel: {
    color: '#8a9499',
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  section: {
    borderLeftWidth: 2,
    borderLeftColor: '#1f262d',
    paddingLeft: 12,
    gap: 8,
  },
  sectionTitle: {
    color: '#e6d4ad',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  stateLine: {
    color: '#c8d1cf',
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    color: '#8a9499',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  labelMargin: {
    marginTop: 12,
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#1f262d',
    backgroundColor: '#050609',
    color: '#c8d1cf',
    fontSize: 14,
    paddingHorizontal: 12,
  },
  hint: {
    color: '#5a6469',
    fontSize: 11,
    letterSpacing: 0.4,
  },
  button: {
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#e6d4ad',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonPressed: { backgroundColor: '#cfbe96' },
  buttonText: {
    color: '#0a0d12',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  feedbackOk: {
    color: '#7ee2a8',
    fontSize: 12,
    marginTop: 8,
    lineHeight: 17,
  },
  feedbackErr: {
    color: '#ff9090',
    fontSize: 12,
    marginTop: 8,
    lineHeight: 17,
  },
  error: {
    color: '#ff9090',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  ok: {
    color: '#7ee2a8',
    fontSize: 12,
    textAlign: 'center',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
})
