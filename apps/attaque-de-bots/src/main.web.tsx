/// <reference lib="dom" />
import { AppRegistry } from 'react-native'
import { Gallery } from './dev/Gallery.web'

// Web-harness entry (react-native-web). Renders the DEV gallery (`?screen=<name>`)
// for screenshot + pixel-diff verification. The native build is unchanged
// (index.js → App via Metro); this is the web-only verification twin.

// `?bg=none` — strip every opaque background (placeholder, canvas, page) so the
// screenshot is the FOREGROUND only on a transparent canvas. The foreground-diff
// tool (_figfg.mjs) composites that over the Figma render's own background, so the
// placeholder-vs-photo difference cancels and only foreground alignment is measured.
if (new URLSearchParams(window.location.search).get('bg') === 'none') {
  for (const el of [document.documentElement, document.body, document.getElementById('root')]) {
    if (el) el.style.background = 'transparent'
  }
}

AppRegistry.registerComponent('attaque-de-bots', () => Gallery)
AppRegistry.runApplication('attaque-de-bots', {
  rootTag: document.getElementById('root'),
})
