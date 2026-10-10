/**
 * Fix-agent phase 5f.7: `resolveCore()`'s `console.error` fallback message
 * used to claim "no Wasm implementation exists yet", which reads as a claim
 * about the WHOLE `@pixelforge/core` package — false since phase 5
 * (`lib/core/kernels.ts` already wires a real Rust/Wasm `floodFill` kernel
 * into `dispatchCommand`). The message is now scoped to what is actually
 * true (`PixelCore`, the document/history boundary, is TS-only until phase
 * 7) and names `PixelKernels` as the exception. It also now logs at most
 * ONCE per session instead of once per `resolveCore()` call.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createEmptyBuffer } from '../pixel-buffer'
import type { DocSnapshot } from './ts-core'

const mockGetPixelCoreEnvOverride = vi.fn<() => string | null>(() => null)
vi.mock('@/config/env', () => ({
  getPixelCoreEnvOverride: () => mockGetPixelCoreEnvOverride(),
}))

function makeDoc(): DocSnapshot {
  const w = 2
  const h = 2
  return {
    canvasWidth: w,
    canvasHeight: h,
    timeline: {
      frames: [{ id: 'F0', layers: [{ id: 'L0', name: 'a', visible: true, locked: false, opacity: 100, pixels: createEmptyBuffer(w, h) }], activeLayerId: 'L0', durationMs: 83 }],
      currentFrameIndex: 0,
      isPlaying: false,
      fps: 12,
      loop: true,
      selectedFrameIndices: [0],
    },
  }
}

describe('resolveCore (fix-agent 5f.7: accurate, once-per-session "wasm" fallback log)', () => {
  afterEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()
    mockGetPixelCoreEnvOverride.mockReturnValue(null)
  })

  it('"ts" override (default): never logs', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    mockGetPixelCoreEnvOverride.mockReturnValue(null)
    const { resolveCore } = await import('./core-config')
    resolveCore(makeDoc())
    resolveCore(makeDoc())
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('"wasm" override: logs an ACCURATE, scoped message, and only ONCE across repeated resolveCore() calls', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    mockGetPixelCoreEnvOverride.mockReturnValue('wasm')
    const { resolveCore, resetWasmPixelCoreFallbackLogForTests } = await import('./core-config')
    resetWasmPixelCoreFallbackLogForTests()

    resolveCore(makeDoc())
    resolveCore(makeDoc())
    resolveCore(makeDoc())

    expect(errorSpy).toHaveBeenCalledTimes(1)
    const message = errorSpy.mock.calls[0][0] as string
    // Must NOT repeat the old, misleading blanket claim...
    expect(message).not.toMatch(/no Wasm implementation exists yet/i)
    // ...must scope the TS-only fact to PixelCore specifically...
    expect(message).toMatch(/PixelCore/)
    // ...and must name PixelKernels as the documented exception (already Wasm-backed since phase 5).
    expect(message).toMatch(/PixelKernels/)
  })
})
