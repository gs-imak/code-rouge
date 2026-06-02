import { resolve } from 'node:path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

// Workspace packages must be BUNDLED into out/main and out/preload, not
// externalized. externalizeDepsPlugin defaults to externalizing every
// `dependencies` entry, which means Electron's main process tries to
// load `@code-rouge/shared-types` at runtime via Node's ESM resolver.
// That resolver follows the package's `main` field (./src/index.ts),
// fails to load raw TypeScript, and crashes the boot with
// `ERR_MODULE_NOT_FOUND ... messages.js`. Excluding the workspace
// scope keeps node_modules deps (electron, electron-store, zod)
// externalized while bundling our internal TS sources inline.
const WORKSPACE_PACKAGES = ['@code-rouge/shared-types', '@code-rouge/shared-utils']

// The preload runs SANDBOXED (webPreferences.sandbox: true), so it must be a
// fully self-contained bundle — a sandboxed preload cannot `require()` from
// node_modules at runtime. `zod` is pulled in transitively via @code-rouge/
// shared-types (GameState/AssautSequenceConfig validation); if it stays
// externalized the preload throws `module not found: zod` at load, which
// silently kills the `window.assaut` bridge (every IPC call then degrades).
// Main runs in full Node and can keep zod external, so this is preload-only.
const PRELOAD_EXCLUDE = [...WORKSPACE_PACKAGES, 'zod']

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({ exclude: WORKSPACE_PACKAGES })],
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
    plugins: [externalizeDepsPlugin({ exclude: PRELOAD_EXCLUDE })],
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
