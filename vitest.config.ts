import { defineConfig } from 'vitest/config'

// Note: explicit `exclude` here REPLACES Vitest's defaults rather than merging,
// so `**/node_modules/**` and `**/dist/**` are listed even though they look
// like obvious defaults. With pnpm's hoisted node_modules layout, an
// app-scoped `apps/<X>/node_modules/@code-rouge/<pkg>/...` path otherwise
// double-discovers tests via the symlinked workspace package.
export default defineConfig({
  test: {
    include: ['apps/**/*.{test,spec}.{ts,tsx}', 'packages/**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/out/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/android/**',
      '**/ios/**',
    ],
    reporters: process.env.CI ? ['default', 'github-actions'] : ['default'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['apps/**/src/**', 'packages/**/src/**'],
      exclude: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    },
  },
})
