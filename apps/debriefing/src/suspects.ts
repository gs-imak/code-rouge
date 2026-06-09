import { useCallback, useEffect, useRef, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { normalizeSuspectList } from './slides/build-slides.js'

// GM-entered Espace-1 suspects (paper-based clues), persisted locally on the
// Débriefing device. Separate from GameState (which is the cross-app synced
// shape) — suspects never leave the GM device. The dedupe/trim logic is the
// pure `normalizeSuspectList` (unit-tested in slides/build-slides.test.ts);
// this hook is thin AsyncStorage glue, mirroring persistence.ts.

const STORAGE_KEY = 'code-rouge:dbr:suspects:v1'

export interface UseSuspectsResult {
  readonly suspects: readonly string[]
  /** Add a suspect; trimmed + deduped (case-insensitive). No-op on blank/dupe. */
  readonly addSuspect: (name: string) => void
  /** Remove a suspect by exact stored value. */
  readonly removeSuspect: (name: string) => void
}

export function useSuspects(): UseSuspectsResult {
  const [suspects, setSuspects] = useState<readonly string[]>([])
  const ref = useRef<readonly string[]>([])
  ref.current = suspects

  useEffect(() => {
    let cancelled = false
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled || raw === null) return
        try {
          const parsed: unknown = JSON.parse(raw)
          if (Array.isArray(parsed)) {
            const list = normalizeSuspectList(
              parsed.filter((x): x is string => typeof x === 'string'),
            )
            ref.current = list
            setSuspects(list)
          }
        } catch {
          // Corrupted blob — start from an empty list.
        }
      })
      .catch(() => {
        // Read failure degrades to an empty list rather than crashing boot.
      })
    return () => {
      cancelled = true
    }
  }, [])

  const persist = useCallback((next: readonly string[]) => {
    ref.current = next
    setSuspects(next)
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {
      // Best-effort: a write miss degrades to a one-session loss, not a crash.
    })
  }, [])

  const addSuspect = useCallback(
    (name: string) => {
      persist(normalizeSuspectList([...ref.current, name]))
    },
    [persist],
  )

  const removeSuspect = useCallback(
    (name: string) => {
      persist(ref.current.filter((s) => s !== name))
    },
    [persist],
  )

  return { suspects, addSuspect, removeSuspect }
}
