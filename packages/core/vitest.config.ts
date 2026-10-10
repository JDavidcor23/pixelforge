import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    benchmark: {
      include: ['**/*.bench.ts'],
      exclude: ['node_modules/**'],
      outputJson: '../../bench/core-results.json',
    },
  },
})
