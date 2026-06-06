import { AssautStepScreen } from '../components/AssautStepScreen'
import { ConnexionScreen } from '../ConnexionScreen'
import { AccueilScreen } from '../components/AccueilScreen'
import { PreparationScreen } from '../components/PreparationScreen'
import { ChoixApprocheScreen } from '../components/ChoixApprocheScreen'
import { PanelScreen } from '../components/PanelScreen'
import { AdminScreen } from '../components/AdminScreen'
import { TutoScreen } from '../components/TutoScreen'
import { DevFlow } from './DevFlow'
import rooftopPhoto from '../assets/scene-rooftop.png'
import mcgyverPhoto from '../assets/scene-mcgyver.png'

// DEV-ONLY screen gallery. Reachable at `?screen=<name>` in the renderer dev
// server so each screen can be screenshot-verified against its maquette without
// driving the whole engine flow. Tree-shaken from the kiosk build (see main.tsx).

const noop = (): void => undefined

const LOREM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'

const FOUR_RESPONSES = [
  { id: 'r1', label: 'Réponse 1' },
  { id: 'r2', label: 'Réponse 2' },
  { id: 'r3', label: 'Réponse 3' },
  { id: 'r4', label: 'Réponse 4' },
]

// Maquette screen number → gallery name + French label, in flow order.
const INDEX: ReadonlyArray<{ readonly n: string; readonly key: string; readonly label: string }> = [
  { n: '1', key: 'admin', label: 'Admin et paramétrages' },
  { n: '2', key: 'flow', label: 'Connexion — ▶ FLUX COMPLET cliquable (démarre ici)' },
  { n: '3', key: 'accueil', label: 'Accueil — Bienvenue équipe' },
  { n: '4', key: 'preparation', label: 'Préparation (hub 3 actions)' },
  { n: '5', key: 'point-acces-submit', label: 'Ajout point d’accès (saisie)' },
  { n: '6', key: 'point-acces-valid', label: 'Validation point d’accès' },
  { n: '7', key: 'point-acces-refus', label: 'Refus point d’accès' },
  { n: '8', key: 'choix-approche', label: 'Choix approche (frontal/furtif)' },
  { n: '8b', key: 'choix-approche-selec', label: 'Choix approche — sélection' },
  { n: '10', key: 'code-autorisation', label: 'Code d’autorisation' },
  { n: '11', key: 'accueil-assaut', label: 'Accueil assaut lancé' },
  { n: '12', key: 'tuto', label: 'Tuto assaut lancé (annoté)' },
  { n: '13', key: 'debut', label: 'Assaut — étape passive (Début/Général/Perdus…)' },
  { n: '15', key: 'interaction', label: 'Assaut — étape interactive (4 réponses)' },
  { n: '20', key: 'mcgyver-photo', label: 'Assaut — photo reçue (overlay)' },
]

function Index(): JSX.Element {
  return (
    <div style={{ color: '#fff', fontFamily: 'system-ui, sans-serif', padding: '40px 56px', minHeight: '100vh', background: 'radial-gradient(circle at 50% 40%, #1c3f54, #080d1a)' }}>
      <h1 style={{ fontSize: 24, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Assaut — écrans</h1>
      <p style={{ opacity: 0.7, fontSize: 14 }}>Cliquez un écran. Le bouton « retour » du navigateur revient ici.</p>
      <ul style={{ listStyle: 'none', padding: 0, columns: 2, gap: 24, maxWidth: 900 }}>
        {INDEX.map((s) => (
          <li key={s.key} style={{ marginBottom: 12, breakInside: 'avoid' }}>
            <a href={`?screen=${s.key}`} style={{ color: '#59b7ff', textDecoration: 'none', fontSize: 16 }}>
              <strong style={{ color: '#fff' }}>{s.n}.</strong> {s.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ScreenGallery({ name }: { readonly name: string }): JSX.Element {
  switch (name) {
    case 'index':
      return <Index />
    // --- Assault-phase steps -------------------------------------------------
    case 'debut':
      return <AssautStepScreen dataRecoveredPercent={27} timerLabel="10:05" subtitle="" />
    case 'interaction':
      return (
        <AssautStepScreen
          dataRecoveredPercent={27}
          timerLabel="10:05"
          subtitle=""
          responses={FOUR_RESPONSES}
        />
      )
    case 'mcgyver-photo':
      return (
        <AssautStepScreen
          dataRecoveredPercent={27}
          timerLabel="10:05"
          subtitle=""
          photo={{ src: mcgyverPhoto, onClose: noop }}
        />
      )

    // --- Prep-phase screens --------------------------------------------------
    case 'accueil':
      return <AccueilScreen teamName="Alpha" body={LOREM} onStart={noop} />
    case 'preparation':
      return <PreparationScreen onAddPoint={noop} onChooseApproach={noop} onLaunch={noop} />
    case 'choix-approche':
      return <ChoixApprocheScreen selected={null} onSelect={noop} onValidate={noop} />
    case 'choix-approche-selec':
      return <ChoixApprocheScreen selected="furtive" onSelect={noop} onValidate={noop} />
    case 'point-acces-submit':
      return (
        <PanelScreen
          icon="radar"
          title="Bonjour opérateur"
          text="Veuillez saisir le point d'entrée dans la planque que vous souhaitez soumettre à approbation."
          input={{ label: "Saisir le point d'entrée :", value: '', onChange: noop }}
          buttonLabel="Valider"
          onSubmit={noop}
        />
      )
    case 'point-acces-valid':
      return (
        <PanelScreen
          tone="success"
          icon="check"
          title="Félicitations opérateurs !"
          text={'Option de sélection "Toits" validée et disponible pour la suite.'}
          photoSrc={rooftopPhoto}
          buttonLabel="Continuer"
          onSubmit={noop}
        />
      )
    case 'point-acces-refus':
      return (
        <PanelScreen
          tone="danger"
          icon="cross"
          title="Échec"
          text="Accès non approprié. Veuillez vous en tenir aux accès déjà identifiés."
          buttonLabel="Recommencer"
          onSubmit={noop}
        />
      )
    case 'code-autorisation':
      return (
        <PanelScreen
          icon="radar"
          title="Bonjour opérateur"
          text="Veuillez saisir le code d'autorisation pour lancer l'assaut sur la planque."
          input={{ label: "Saisissez le code d'autorisation :", value: '', onChange: noop }}
          buttonLabel="Valider"
          onSubmit={noop}
        />
      )
    case 'accueil-assaut':
      return (
        <PanelScreen
          title="Opérateur,"
          text={'L\'assaut sur la planque du Réseau est sur le point d\'être initiée.\n\nQuelques rappels sur le fonctionnement de votre interface tactique vont suivre …'}
          buttonLabel="C'est parti !"
          onSubmit={noop}
        />
      )

    case 'connexion':
      return <ConnexionScreen code="" onCodeChange={noop} onValidate={noop} nucConnection="connected" />
    case 'tuto':
      return <TutoScreen />
    case 'admin':
      return (
        <AdminScreen connection="connected" onReset={noop} onTransmit={noop} onSave={noop} />
      )
    case 'flow':
      return <DevFlow />

    default:
      return <div style={{ color: '#fff', padding: 24 }}>unknown screen: {name}</div>
  }
}
