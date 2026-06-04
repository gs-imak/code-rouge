import { createContext, useContext, type JSX, type ReactNode } from 'react'

// Live HUD values (score, timer) provided by the FlowRunner and read by HudHeader,
// so the running game state reaches the HUD without prop-drilling through every
// screen. The dev Gallery renders screens WITHOUT a provider, so HudHeader falls
// back to the maquette defaults there — the static pixel-diff stays unchanged.
export interface HudValues {
  readonly score?: string
  readonly timer?: string
}

const HudContext = createContext<HudValues>({})

export function HudProvider({ value, children }: { readonly value: HudValues; readonly children: ReactNode }): JSX.Element {
  return <HudContext.Provider value={value}>{children}</HudContext.Provider>
}

export function useHud(): HudValues {
  return useContext(HudContext)
}
