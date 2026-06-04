/// <reference lib="dom" />
import { AppRegistry } from 'react-native'
import App from './App'
import { Gallery } from './dev/Gallery.web'

// Web-harness entry (react-native-web). Default: the DEV gallery (`?screen=<name>`)
// for per-screen pixel-diff. `?flow` mounts the REAL App (the live flow engine) so
// the whole connexion→…→fin sequence can be click-tested + screenshot in-browser.
// The native build is unchanged (index.js → App via Metro).

// `?bg=none` — strip every opaque background (placeholder, canvas, page) so the
// screenshot is the FOREGROUND only on a transparent canvas. The foreground-diff
// tool (_figfg.mjs) composites that over the Figma render's own background, so the
// placeholder-vs-photo difference cancels and only foreground alignment is measured.
if (new URLSearchParams(window.location.search).get('bg') === 'none') {
  for (const el of [document.documentElement, document.body, document.getElementById('root')]) {
    if (el) el.style.background = 'transparent'
  }
}

const Root = new URLSearchParams(window.location.search).has('flow') ? App : Gallery

AppRegistry.registerComponent('attaque-de-bots', () => Root)
AppRegistry.runApplication('attaque-de-bots', {
  rootTag: document.getElementById('root'),
})
