import { AssautStepScreen } from '../components/AssautStepScreen'

// DEV-ONLY screen gallery. Reachable at `?screen=<name>` in the renderer dev
// server so each screen can be screenshot-verified against its maquette without
// driving the whole engine flow. Never reached in the kiosk build (no query
// string). Removed once the SequenceRunner can navigate to every step.

const PHOTO_PLACEHOLDER =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='640' height='420'><rect width='100%25' height='100%25' fill='%23121a2b'/><text x='50%25' y='50%25' fill='%235a7' font-family='sans-serif' font-size='20' text-anchor='middle'>photo</text></svg>"

const FOUR_RESPONSES = [
  { id: 'r1', label: 'Réponse 1' },
  { id: 'r2', label: 'Réponse 2' },
  { id: 'r3', label: 'Réponse 3' },
  { id: 'r4', label: 'Réponse 4' },
]

export function ScreenGallery({ name }: { readonly name: string }): JSX.Element {
  switch (name) {
    case 'debut':
      return (
        <AssautStepScreen dataRecoveredPercent={27} timerLabel="10:05" subtitle="Sous-titre …" />
      )
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
          photo={{ src: PHOTO_PLACEHOLDER, onClose: () => undefined }}
        />
      )
    default:
      return <div style={{ color: '#fff', padding: 24 }}>unknown screen: {name}</div>
  }
}
