import React from 'react'
import ReactDOM from 'react-dom/client'
import { tokenCssText } from '@code-rouge/design-system'
import App from './App'
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

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
