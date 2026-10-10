/**
 * Fix-agent phase 5f.7: `resolveCore()`'s `console.error` fallback message
 * used to claim "no Wasm implementation exists yet", which reads as a claim
 * about the WHOLE `@pixelforge/core` package — false since phase 5
 * (`lib/core/kernels.ts` already wires a real Rust/Wasm `floodFill` kernel
 * into `dispatchCommand`). It also now logs at most ONCE per session instead
 * of once per `resolveCore()` call.
 *
 * Phase 7 update: `'wasm'` now ACTUALLY attempts a `WasmPixelCore` via
 * `wasm-pixel-core-resolver.ts`'s `tryResolveWasmPixelCore` (mocked here —
 * that function's OWN behavior, including the trap-safety wrapper, is
 * covered by `wasm-pixel-core-resolver.test.ts`). This file only tests
 * `resolveCore()`'s own wiring: does it use what `tryResolveWasmPixelCore`
 * returns, and does it fall back + log correctly when that returns `null`
 * (module not loaded / construction failed)?
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createEmptyBuffer } from '../pixel-buffer'
import type { DocSnapshot } from './ts-core'
import type { PixelCore } from './pixel-core'

const mockGetPixelCoreEnvOverride = vi.fn<() => string | null>(() => null)
vi.mock('@/config/env', () => ({
  getPixelCoreEnvOverride: () => mockGetPixelCoreEnvOverride(),
}))

const mockTryResolveWasmPixelCore = vi.fn<(doc: DocSnapshot) => PixelCore | null>(() => null)
vi.mock('./wasm-pixel-core-resolver', () => ({
  tryResolveWasmPixelCore: (doc: DocSnapshot) => mockTryResolveWasmPixelCore(doc),
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

describe('resolveCore', () => {
  afterEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()
    mockGetPixelCoreEnvOverride.mockReturnValue(null)
    mockTryResolveWasmPixelCore.mockReset()
    mockTryResolveWasmPixelCore.mockReturnValue(null)
  })

  it('"ts" override (default): never logs, never even asks for a Wasm core', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    mockGetPixelCoreEnvOverride.mockReturnValue(null)
    const { resolveCore } = await import('./core-config')
    resolveCore(makeDoc())
    resolveCore(makeDoc())
    expect(errorSpy).not.toHaveBeenCalled()
    expect(mockTryResolveWasmPixelCore).not.toHaveBeenCalled()
  })

  it('"wasm" override with the module not yet loaded: falls back to TsPixelCore and logs ONCE across repeated resolveCore() calls', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    mockGetPixelCoreEnvOverride.mockReturnValue('wasm')
    mockTryResolveWasmPixelCore.mockReturnValue(null)
    const { resolveCore, resetWasmPixelCoreFallbackLogForTests } = await import('./core-config')
    resetWasmPixelCoreFallbackLogForTests()

    const core1 = resolveCore(makeDoc())
    const core2 = resolveCore(makeDoc())
    resolveCore(makeDoc())

    expect(core1.impl).toBe('ts')
    expect(core2.impl).toBe('ts')
    expect(mockTryResolveWasmPixelCore).toHaveBeenCalledTimes(3)
    expect(errorSpy).toHaveBeenCalledTimes(1)
    const message = errorSpy.mock.calls[0][0] as string
    expect(message).not.toMatch(/no Wasm implementation exists yet/i)
    expect(message).toMatch(/wasm/i)
  })

  it('"wasm" override with the module already loaded: uses the Wasm core it gets back, logs nothing', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    mockGetPixelCoreEnvOverride.mockReturnValue('wasm')
    const fakeWasmCore: PixelCore = {
      impl: 'wasm',
      dispatch: () => {
        throw new Error('not used in this test')
      },
      undo: () => {
        throw new Error('not used in this test')
      },
      redo: () => {
        throw new Error('not used in this test')
      },
      readLayer: () => new Uint8ClampedArray(0),
      snapshot: () => {
        throw new Error('not used in this test')
      },
      exportDocument: () => {
        throw new Error('not used in this test')
      },
      importDocument: () => undefined,
      canUndo: false,
      canRedo: false,
    }
    mockTryResolveWasmPixelCore.mockReturnValue(fakeWasmCore)
    const { resolveCore } = await import('./core-config')

    const core = resolveCore(makeDoc())
    expect(core.impl).toBe('wasm')
    expect(core).toBe(fakeWasmCore)
    expect(errorSpy).not.toHaveBeenCalled()
  })
})
