import type { ReactNode } from 'react'
import './Panel.css'

// The maquette's translucent rounded panel used across the prep screens (Point
// d'accès, Choix Approche, Accueil assaut…). Tone tints the border/background for
// the success (« Félicitations ») and danger (« Échec ») result panels.

export interface PanelProps {
  readonly children: ReactNode
  readonly tone?: 'default' | 'success' | 'danger'
}

export function Panel({ children, tone = 'default' }: PanelProps): JSX.Element {
  return <div className={`panel panel--${tone}`}>{children}</div>
}
