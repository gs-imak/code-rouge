import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// DEV-ONLY web harness. The app ships to Android via Metro; this renders the same
// React Native screens through react-native-web so they can be screenshot +
// pixel-diffed against the Figma maquettes in a browser — the exact verification
// loop used for Assaut, adapted for RN. The whole trick is aliasing
// `react-native` → `react-native-web`. Not a production target.
export default defineConfig({
  root: resolve(__dirname),
  plugins: [react()],
  define: {
    __DEV__: 'true',
    'process.env.NODE_ENV': '"development"',
    global: 'globalThis',
  },
  resolve: {
    alias: {
      'react-native': 'react-native-web',
    },
    // Prefer `.web.*` overrides so a screen can ship a web-only stub if a native
    // module (kiosk, etc.) has no web equivalent.
    extensions: ['.web.tsx', '.web.ts', '.web.jsx', '.web.js', '.tsx', '.ts', '.jsx', '.js'],
  },
  optimizeDeps: {
    include: ['react-native-web', 'react-dom', 'react'],
    esbuildOptions: { jsx: 'automatic' },
  },
  server: { port: 5273 },
})
