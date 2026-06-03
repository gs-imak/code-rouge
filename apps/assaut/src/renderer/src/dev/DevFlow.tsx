import { useState } from 'react'
import { parseAssautSequenceConfig } from '@code-rouge/shared-types'
import sequenceJson from '../../../../assets/config/sequence.json'
import {
  advance,
  applyChoice,
  createSession,
  currentStep,
  type AssautSession,
} from '../engine/assaut-sequence'
import { SequenceRunner } from '../components/SequenceRunner'

// DEV-ONLY: drives the real SequenceRunner with the actual sequence.json (parsed
// here instead of over IPC) so the full engine flow is click-through testable in
// the browser dev server, where the Electron `window.assaut` bridge is absent.
// Tree-shaken from the kiosk build (gated on import.meta.env.DEV in main.tsx).

const CONFIG = parseAssautSequenceConfig(sequenceJson)

export function DevFlow(): JSX.Element {
  const [session, setSession] = useState<AssautSession>(() => createSession(CONFIG))
  const [code, setCode] = useState('')

  const step = currentStep(CONFIG, session)
  if (step === null) {
    return <div style={{ color: '#fff', padding: 24 }}>Flow terminé ({session.phase}).</div>
  }

  return (
    <SequenceRunner
      step={step}
      dataRecoveredPercent={session.dataRecoveredPercent}
      onSubmit={(event) => setSession((prev) => advance(CONFIG, prev, event))}
      onChoose={(choiceId) => setSession((prev) => applyChoice(CONFIG, prev, choiceId))}
      authCode={code}
      onAuthCodeChange={setCode}
      teamName="Alpha"
    />
  )
}
