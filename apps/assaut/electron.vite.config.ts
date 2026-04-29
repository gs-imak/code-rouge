import { resolve } from 'node:path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'out/main',
      // No source maps in prod — anyone with brief filesystem access (a
      // contractor on the venue PC, or a USB exfil mid-game) shouldn't be
      // able to read the full TypeScript source from out/main/index.js.
      sourcemap: false,
      rollupOptions: { input: resolve(__dirname, 'src/main/index.ts') },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'out/preload',
      sourcemap: false,
      rollupOptions: { input: resolve(__dirname, 'src/preload/index.ts') },
    },
  },
  renderer: {
    root: 'src/renderer',
    plugins: [react()],
    resolve: {
      alias: {
        '@renderer': resolve(__dirname, 'src/renderer/src'),
        '@shared': resolve(__dirname, 'src/shared'),
      },
    },
    build: {
      outDir: 'out/renderer',
      rollupOptions: { input: resolve(__dirname, 'src/renderer/index.html') },
    },
  },
})
