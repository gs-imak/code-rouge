import { AssautStepScreen } from '../components/AssautStepScreen'
import { AccueilScreen } from '../components/AccueilScreen'
import { PreparationScreen } from '../components/PreparationScreen'
import { ChoixApprocheScreen } from '../components/ChoixApprocheScreen'
import { PanelScreen } from '../components/PanelScreen'
import { AdminScreen } from '../components/AdminScreen'
import { TutoScreen } from '../components/TutoScreen'

// DEV-ONLY screen gallery. Reachable at `?screen=<name>` in the renderer dev
// server so each screen can be screenshot-verified against its maquette without
// driving the whole engine flow. Tree-shaken from the kiosk build (see main.tsx).

const noop = (): void => undefined

const PHOTO_PLACEHOLDER =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='480' height='320'><rect width='100%25' height='100%25' fill='%23172238'/><text x='50%25' y='50%25' fill='%236aa' font-family='sans-serif' font-size='18' text-anchor='middle'>toits</text></svg>"

const LOREM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'

const FOUR_RESPONSES = [
  { id: 'r1', label: 'Réponse 1' },
  { id: 'r2', label: 'Réponse 2' },
  { id: 'r3', label: 'Réponse 3' },
  { id: 'r4', label: 'Réponse 4' },
]

export function ScreenGallery({ name }: { readonly name: string }): JSX.Element {
  switch (name) {
    // --- Assault-phase steps -------------------------------------------------
    case 'debut':
      return <AssautStepScreen dataRecoveredPercent={27} timerLabel="10:05" subtitle="Sous-titre …" />
    case 'interaction':
      return (
        <AssautStepScreen
          dataRecoveredPercent={27}
          timerLabel="10:05"
          subtitle="Dernière phrase figée pour les joueurs"
          responses={FOUR_RESPONSES}
        />
      )
    case 'mcgyver-photo':
      return (
        <AssautStepScreen
          dataRecoveredPercent={27}
          timerLabel="10:05"
          subtitle="Sous-titre …"
          photo={{ src: PHOTO_PLACEHOLDER, onClose: noop }}
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
          photoSrc={PHOTO_PLACEHOLDER}
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
          text="L'assaut sur la planque du Réseau est sur le point d'être initiée. Quelques rappels sur le fonctionnement de votre interface tactique vont suivre …"
          buttonLabel="C'est parti !"
          onSubmit={noop}
        />
      )

    case 'tuto':
      return <TutoScreen />
    case 'admin':
      return (
        <AdminScreen connection="connected" onReset={noop} onTransmit={noop} onSave={noop} />
      )

    default:
      return <div style={{ color: '#fff', padding: 24 }}>unknown screen: {name}</div>
  }
}
