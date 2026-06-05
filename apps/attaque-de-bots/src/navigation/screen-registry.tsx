import type { JSX } from 'react'
import type { MailboxMail } from '@code-rouge/shared-types'
import type { FlowEvent, FlowView } from '../engine/bots-flow'
import type { EnigmeKind, SaisieScreenProps } from './types'
import { EnigmeAccueil } from '../components/EnigmeAccueil'
import { AccueilScreen } from '../screens/AccueilScreen'
import { BddAccueilScreen } from '../screens/BddAccueilScreen'
import { BddLoadingScreen } from '../screens/BddLoadingScreen'
import { BddScreen } from '../screens/BddScreen'
import { BoiteMailsScreen } from '../screens/BoiteMailsScreen'
import { ChoixScreen } from '../screens/ChoixScreen'
import { ConnexionScreen } from '../screens/ConnexionScreen'
import { Dd2AccueilScreen } from '../screens/Dd2AccueilScreen'
import { Dd2Screen } from '../screens/Dd2Screen'
import { DdAccueilScreen } from '../screens/DdAccueilScreen'
import { DdScreen } from '../screens/DdScreen'
import { FinaleScreen } from '../screens/FinaleScreen'
import { FinScreen } from '../screens/FinScreen'
import { FishingScreen } from '../screens/FishingScreen'
import { LecAccueilScreen } from '../screens/LecAccueilScreen'
import { LecScreen } from '../screens/LecScreen'
import { MailsScreen } from '../screens/MailsScreen'
import { MdpAccueilScreen } from '../screens/MdpAccueilScreen'
import { MdpSaisieScreen } from '../screens/MdpSaisieScreen'
import { PiratageScreen } from '../screens/PiratageScreen'
import { ResAccueilScreen } from '../screens/ResAccueilScreen'
import { ResSaisieScreen } from '../screens/ResSaisieScreen'
import { ServeursScreen } from '../screens/ServeursScreen'
import { SrvAccueilScreen } from '../screens/SrvAccueilScreen'
import { TelAccueilScreen } from '../screens/TelAccueilScreen'
import { TelSaisieScreen } from '../screens/TelSaisieScreen'
import { TutoScreen } from '../screens/TutoScreen'

// Maps the engine's current view → the screen component, with engine-bound
// handlers. This is the ONE place that knows screen ids; the engine stays pure
// and the screens stay presentational (immutable rule #2). The dev Gallery uses
// its own static map; this registry is the running app's.

export interface RunnerCtx {
  readonly dispatch: (event: FlowEvent) => void
  /** Connexion code → team id, owned by the app (writes GameState then advances). */
  readonly onSubmitTeam: (code: string) => void
  readonly mails: readonly MailboxMail[]
}

// Placeholder briefing for the finale (no bespoke accueil screen in the maquette
// set — rendered through the shared shell; real copy is content, Nathanaël).
const FINALE_BRIEF =
  'Dernière étape : déjouez la séquence finale de Section 13 pour reprendre le contrôle.'

// Per-kind accueil briefing screens. finale falls back to the shared shell.
const ACCUEIL: Record<EnigmeKind, (p: { readonly onContinue?: () => void }) => JSX.Element> = {
  mdp: MdpAccueilScreen,
  telephone: TelAccueilScreen,
  reseau: ResAccueilScreen,
  serveurs: SrvAccueilScreen,
  'disques-durs': DdAccueilScreen,
  'disques-durs-2': Dd2AccueilScreen,
  bdd: BddAccueilScreen,
  'lecteur-carte': LecAccueilScreen,
  finale: ({ onContinue }) => <EnigmeAccueil title="Énigme finale" body={FINALE_BRIEF} onContinue={onContinue} />,
}

// Per-kind saisie / success / error screens.
const BODY: Record<EnigmeKind, (p: SaisieScreenProps) => JSX.Element> = {
  mdp: MdpSaisieScreen,
  telephone: TelSaisieScreen,
  reseau: ResSaisieScreen,
  serveurs: ServeursScreen,
  'disques-durs': DdScreen,
  'disques-durs-2': Dd2Screen,
  bdd: BddScreen,
  'lecteur-carte': LecScreen,
  finale: FinaleScreen,
}

export function renderView(view: FlowView, ctx: RunnerCtx): JSX.Element {
  const cont = (): void => ctx.dispatch({ type: 'CONTINUE' })

  if (view.section === 'prologue') {
    switch (view.nodeId) {
      case 'accueil':
        return <AccueilScreen onContinue={cont} />
      case 'tuto':
        return <TutoScreen onContinue={cont} />
      case 'choix':
        return <ChoixScreen onContinue={cont} />
      case 'connexion':
      default:
        return <ConnexionScreen onSubmit={ctx.onSubmitTeam} />
    }
  }

  if (view.section === 'epilogue') {
    return <FinScreen score={view.score} />
  }

  // énigmes
  const kind = view.kind
  if (kind === null) return <ConnexionScreen onSubmit={ctx.onSubmitTeam} /> // unreachable

  if (kind === 'mailbox') {
    const onOpenMail = (id: string, phishing: boolean): void =>
      ctx.dispatch({ type: 'OPEN_MAIL', mailId: id, phishing })
    switch (view.phase) {
      case 'reading':
        return (
          <MailsScreen
            mail={ctx.mails.find((m) => m.id === view.openedMailId)}
            onBack={() => ctx.dispatch({ type: 'BACK' })}
          />
        )
      case 'phishing':
        return <FishingScreen onContinue={() => ctx.dispatch({ type: 'BACK' })} />
      case 'inbox':
      default:
        return <BoiteMailsScreen mails={ctx.mails} onOpenMail={onOpenMail} onContinue={cont} />
    }
  }

  if (kind === 'piratage') {
    return <PiratageScreen onDone={cont} />
  }

  // input énigmes
  switch (view.phase) {
    case 'loading':
      return <BddLoadingScreen onDone={cont} />
    case 'saisie':
    case 'success':
    case 'error': {
      const Body = BODY[kind]
      return (
        <Body
          state={view.phase}
          attempts={view.attempts}
          canRetry={view.canRetry}
          onValidate={(value) => ctx.dispatch({ type: 'ANSWER', input: value })}
          onContinue={cont}
          onRetry={() => ctx.dispatch({ type: 'RETRY' })}
        />
      )
    }
    case 'accueil':
    default: {
      const Accueil = ACCUEIL[kind]
      return <Accueil onContinue={cont} />
    }
  }
}
