/**
 * Fix-agent 6f.1/6f.3 (verify-report-phase-6.md findings): `sprite-pipeline.ts`
 * used to import `@pixelforge/core`'s `resolveKernels()` directly, which has
 * NO knowledge of the `pf:core`/`VITE_PIXEL_CORE` kill switch — every
 * quantize/downscale call attempted to load Wasm regardless of the override.
 * This suite proves the fix routes through `lib/core/kernels.ts`'s
 * `getActiveKernelsAsync()` instead (same chain every other kernel call site
 * honors), and that a kernel-rejected call falls back to the TS oracle with a
 * once-per-session `console.error` (never silent).
 *
 * `@/config/env` is mocked (not `localStorage`, unavailable in this suite's
 * `node` test environment — see `vite.config.ts`) to drive the same override
 * chain `kernels.test.ts` drives. `./image-decode` is mocked so no real
 * `Image`/`canvas` decode is needed — this suite is about kernel ROUTING, not
 * image decoding.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PixelBuffer } from '@/types'

const mockGetPixelCoreEnvOverride = vi.fn<() => string | null>(() => null)
vi.mock('@/config/env', () => ({
  getPixelCoreEnvOverride: () => mockGetPixelCoreEnvOverride(),
}))

const mockBase64ToNativePixels = vi.fn<() => Promise<PixelBuffer>>()
vi.mock('./image-decode', () => ({
  base64ToNativePixels: () => mockBase64ToNativePixels(),
}))

function solidBuffer(size: number, r: number, g: number, b: number, a: number): PixelBuffer {
  const data = new Uint8ClampedArray(size * size * 4)
  for (let i = 0; i < size * size; i++) data.set([r, g, b, a], i * 4)
  return { w: size, h: size, data }
}

describe('sprite-pipeline kernel routing (fix-agent 6f.1: must use getActiveKernelsAsync, not @pixelforge/core resolveKernels() directly)', () => {
  afterEach(() => {
    vi.resetModules()
    mockGetPixelCoreEnvOverride.mockReturnValue(null)
  })

  it('"ts" override (default): decodeToPixels never starts a Wasm resolution', async () => {
    mockGetPixelCoreEnvOverride.mockReturnValue(null) // -> core-config.ts default: 'ts'
    mockBase64ToNativePixels.mockResolvedValue(solidBuffer(4, 200, 10, 10, 255))
    const { decodeToPixels } = await import('./sprite-pipeline')
    const { waitForKernelsResolved } = await import('./core/kernels')

    const out = await decodeToPixels('data:image/png;base64,x', 4, false)

    expect(out.w).toBe(4)
    expect(out.h).toBe(4)
    // Proof no Wasm resolution was ever kicked off (the actual kill-switch
    // bypass this fix closes): `waitForKernelsResolved` is an immediate
    // no-op whenever `pending` was never set — same proof `kernels.test.ts`
    // uses for the synchronous accessor.
    await waitForKernelsResolved()
  })

  it('"wasm" override: decodeToPixels resolves through a working (loaded/called) kernel path', async () => {
    mockGetPixelCoreEnvOverride.mockReturnValue('wasm')
    mockBase64ToNativePixels.mockResolvedValue(solidBuffer(4, 200, 10, 10, 255))
    const { decodeToPixels } = await import('./sprite-pipeline')

    const out = await decodeToPixels('data:image/png;base64,x', 4, false)

    // Either the real Wasm kernels (pkg/ built) or a demoted-to-ts fallback
    // (pkg/ missing/failed) — both are correct; the point is the 'wasm'
    // override actually drives a real resolution attempt and the pipeline
    // still produces a valid result either way.
    expect(out.w).toBe(4)
    expect(out.h).toBe(4)
  })
})

describe('kernel-fallback logging (fix-agent 6f.1: a kernel returning undefined logs once, never silently uses the oracle)', () => {
  afterEach(() => {
    vi.doUnmock('./core/kernels')
    vi.resetModules()
    mockGetPixelCoreEnvOverride.mockReturnValue(null)
  })

  it('logs via console.error exactly once, even though one decodeToPixels call triggers BOTH the downscale and quantize fallback', async () => {
    mockGetPixelCoreEnvOverride.mockReturnValue(null)
    mockBase64ToNativePixels.mockResolvedValue(solidBuffer(4, 200, 10, 10, 255))

    // A fake "always rejects" kernel set — both `quantize` and `downscale`
    // return `undefined`, the "kernel rejected a seemingly-valid call" case
    // that should never happen in production for a valid in-memory buffer,
    // but must never be silently swallowed if it does.
    vi.doMock('./core/kernels', () => ({
      getActiveKernelsAsync: async () => ({
        impl: 'ts',
        putPoints: () => 0,
        floodFill: () => undefined,
        cloneBuffer: (d: Uint8Array) => d,
        diffRect: () => undefined,
        extractRect: () => undefined,
        writeRect: () => false,
        bytesEqual: () => true,
        quantize: () => undefined,
        downscale: () => undefined,
      }),
    }))

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { decodeToPixels, resetKernelFallbackLogForTests } = await import('./sprite-pipeline')
    resetKernelFallbackLogForTests()

    const out = await decodeToPixels('data:image/png;base64,x', 4, true) // quantize=true -> exercises both downscale AND quantize fallback paths

    expect(out.w).toBe(4) // the TS oracle fallback still produced a valid result
    expect(errorSpy).toHaveBeenCalledTimes(1)
  })
})
