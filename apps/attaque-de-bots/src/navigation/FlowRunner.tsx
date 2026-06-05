import type { JSX } from 'react'
import { ScaledCanvas } from '../components/ScaledCanvas'
import type { FlowView } from '../engine/bots-flow'
import { HudProvider } from './HudContext'
import { renderView, type RunnerCtx } from './screen-registry'

// Renders the engine's current view inside the scaled design canvas, providing
// the live score to the HUD. Thin glue: all decisions live in the engine
// (FlowView) and the registry (view → screen). The app owns the hooks + ctx.
export function FlowRunner({ view, ctx }: { readonly view: FlowView; readonly ctx: RunnerCtx }): JSX.Element {
  return (
    <HudProvider value={{ score: String(view.score) }}>
      <ScaledCanvas>{renderView(view, ctx)}</ScaledCanvas>
    </HudProvider>
  )
}
