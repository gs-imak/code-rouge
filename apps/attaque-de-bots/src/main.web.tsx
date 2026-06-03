/// <reference lib="dom" />
import { AppRegistry } from 'react-native'
import { Gallery } from './dev/Gallery.web'

// Web-harness entry (react-native-web). Renders the DEV gallery (`?screen=<name>`)
// for screenshot + pixel-diff verification. The native build is unchanged
// (index.js → App via Metro); this is the web-only verification twin.
AppRegistry.registerComponent('attaque-de-bots', () => Gallery)
AppRegistry.runApplication('attaque-de-bots', {
  rootTag: document.getElementById('root'),
})
