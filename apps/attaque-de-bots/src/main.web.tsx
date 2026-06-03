import { AppRegistry } from 'react-native'
import App from './App'

// Web-harness entry (react-native-web). Mounts the same <App> the native build
// runs, so the screens render in a browser for screenshot + pixel-diff. The
// native entry stays `index.js` → AppRegistry via Metro; this is the web twin.
AppRegistry.registerComponent('attaque-de-bots', () => App)
AppRegistry.runApplication('attaque-de-bots', {
  rootTag: document.getElementById('root'),
})
