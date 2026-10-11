import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import wasm from 'vite-plugin-wasm'
import path from 'path'

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler', {}]],
      },
    }),
    // Phase 4 (design.md "File Changes"): lets Vite import `@pixelforge/core`'s
    // wasm-pack `--target web` output directly (`import('../pkg/...')`)
    // without a manual asset/URL dance.
    //
    // `vite-plugin-top-level-await` was removed: it crashed production builds
    // (`missing field 'type'` from its @swc/core transform). Top-level await
    // is native from ES2022, so `build.target` below covers it instead.
    wasm(),
  ],
  build: {
    target: 'es2022',
  },
  resolve: {
    alias: [{ find: '@', replacement: path.resolve(__dirname, 'src') }],
  },
  server: {
    port: 5173,
  },
  test: {
    globals: true,
    environment: 'node',
    benchmark: {
      include: ['**/*.bench.ts'],
      exclude: ['node_modules/**'],
      outputJson: '../../bench/results.json',
    },
  },
})
