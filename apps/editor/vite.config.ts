import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'
import path from 'path'

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler', {}]],
      },
    }),
    // Phase 4 (design.md "File Changes"): lets Vite import `@pixelforge/core`'s
    // wasm-pack `--target web` output directly (`import('../pkg/...')`,
    // top-level `await` inside that glue code) without a manual asset/URL
    // dance. Order matters: `wasm()` must come before `topLevelAwait()`.
    //
    // W6 (phase 4f) re-examined whether `--target web`'s output actually
    // NEEDS these: unlike `--target bundler` (raw `import pkg from
    // './foo.wasm'`, which genuinely requires `vite-plugin-wasm`'s loader),
    // `--target web` generates plain JS with its own `init()` that does an
    // internal `fetch(new URL('pixelforge_core_bg.wasm', import.meta.url))`
    // — Vite's native asset handling resolves that `new URL(...)` reference
    // on its own, with no bundler-wasm plugin involved. So on a close
    // reading, these two plugins are very likely REDUNDANT for this
    // package's `--target web` output specifically.
    //
    // KEPT rather than removed, for one reason: this agent's task explicitly
    // disallows running `vite build`/`vite dev` (no app builds), so "remove
    // and confirm the app still bundles/serves" cannot be verified here —
    // only asserted from reading wasm-pack's documented `--target web`
    // output shape. Removing a build-graph dependency without being able to
    // run the one tool that would catch a mistake is exactly the kind of
    // unverified change this codebase's conventions call out as a risk, not
    // a shortcut worth taking. Whoever next runs a real `vite build`/`vite
    // dev` against `@pixelforge/core` (W6 landed this phase; actual kernel
    // usage from editor runtime code is still phase 5+) should try removing
    // both plugins and confirm the dev server still loads/HMRs the wasm
    // import correctly before deleting this comment.
    wasm(),
    topLevelAwait(),
  ],
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
