import React from 'react'
import ReactDOM from 'react-dom/client'
import { tokenCssText } from '@code-rouge/design-system'
import App from './App'
import { ScreenGallery } from './dev/ScreenGallery'
import './index.css'

// Inject the « Section 13 » design tokens as CSS custom properties at boot,
// derived from the single source of truth in @code-rouge/design-system. Electron
// is a fixed Chromium target, so a <style> with :root vars is the cheapest
// theming primitive — every screen's CSS reads them via var(--cr-*).
const themeStyle = document.createElement('style')
themeStyle.id = 'cr-tokens'
themeStyle.textContent = tokenCssText()
document.head.appendChild(themeStyle)

const root = document.getElementById('root')
if (root === null) throw new Error('#root missing in index.html')

// DEV-ONLY: `?screen=<name>` renders a single screen from the gallery for
// maquette verification. Gated on import.meta.env.DEV so the gallery is
// tree-shaken out of the kiosk production build entirely.
const devScreen = import.meta.env.DEV
  ? new URLSearchParams(window.location.search).get('screen')
  : null

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    {devScreen !== null ? <ScreenGallery name={devScreen} /> : <App />}
  </React.StrictMode>,
)
