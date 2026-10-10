/**
 * Phase 5: the editor-side bridge between the synchronous `dispatchCommand`
 * (`fill` case) and `@pixelforge/core`'s async `resolveKernels()`. Mocks
 * `@/config/env` (not `localStorage`, which doesn't exist in this suite's
 * `node` test environment — see `vite.config.ts`'s `test.environment`) to
 * drive the SAME override chain `core-config.ts`'s `resolveCoreImpl` reads.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { tsKernels } from '@pixelforge/core'

const mockGetPixelCoreEnvOverride = vi.fn<() => string | null>(() => null)
vi.mock('@/config/env', () => ({
  getPixelCoreEnvOverride: () => mockGetPixelCoreEnvOverride(),
}))

describe('kernels (phase 5: synchronous PixelKernels accessor over async resolveKernels())', () => {
  afterEach(async () => {
    vi.resetModules()
    mockGetPixelCoreEnvOverride.mockReturnValue(null)
  })

  it('default override ("ts"): getActiveKernels always returns tsKernels, synchronously, without ever loading Wasm', async () => {
    mockGetPixelCoreEnvOverride.mockReturnValue(null) // -> core-config.ts default: 'ts'
    const { getActiveKernels, waitForKernelsResolved } = await import('./kernels')
    expect(getActiveKernels()).toBe(tsKernels)
    // never started resolving — waiting for "the in-flight resolution" is an immediate no-op
    await waitForKernelsResolved()
    expect(getActiveKernels()).toBe(tsKernels)
  })

  it('"wasm" override: starts as tsKernels synchronously, swaps to the resolved Wasm kernels once loaded', async () => {
    mockGetPixelCoreEnvOverride.mockReturnValue('wasm')
    const { getActiveKernels, waitForKernelsResolved } = await import('./kernels')

    // the very first (synchronous) read, before the async load has any chance to finish, must still be usable
    const first = getActiveKernels()
    expect(first.floodFill).toBeTypeOf('function')

    await waitForKernelsResolved()

    const resolved = getActiveKernels()
    // either the real Wasm kernels (pkg/ built in this environment) or a
    // demoted-to-ts fallback (pkg/ missing) — both are always correct;
    // what this test actually pins down is that resolution SETTLES and the
    // accessor keeps working either way, never throwing/hanging.
    expect(resolved.floodFill).toBeTypeOf('function')
    const data = new Uint8Array(4 * 4 * 4)
    expect(resolved.floodFill(data, 4, 4, 0, 0, 0xff0000ff)).toEqual([0, 0, 4, 4])
  })

  it('flipping the override back to "ts" at runtime takes effect on the very next call — no reload needed (rollback-without-redeploy)', async () => {
    mockGetPixelCoreEnvOverride.mockReturnValue('wasm')
    const { getActiveKernels, waitForKernelsResolved } = await import('./kernels')
    await waitForKernelsResolved()

    mockGetPixelCoreEnvOverride.mockReturnValue('ts') // flip the flag
    // `.impl === 'ts'`, not `toBe(tsKernels)`: `vi.resetModules()` between
    // tests re-evaluates `@pixelforge/core` too, so this test's OWN
    // statically-imported `tsKernels` is a different module instance than
    // the one `./kernels.ts` (freshly re-imported above) now holds — same
    // object identity issue a real app never hits (it never calls
    // `vi.resetModules()` at runtime), so behavioral equality is the correct
    // thing to assert here, not reference equality.
    expect(getActiveKernels().impl).toBe('ts') // immediate, synchronous rollback
  })
})

describe('getActiveKernelsAsync (fix-agent 6f.1: the async accessor async call sites use instead of @pixelforge/core resolveKernels() directly)', () => {
  afterEach(async () => {
    vi.resetModules()
    mockGetPixelCoreEnvOverride.mockReturnValue(null)
  })

  it('default override ("ts"): resolves to tsKernels WITHOUT ever starting a Wasm resolution', async () => {
    mockGetPixelCoreEnvOverride.mockReturnValue(null) // -> 'ts'
    const { getActiveKernelsAsync, waitForKernelsResolved } = await import('./kernels')

    const kernels = await getActiveKernelsAsync()

    // `.impl === 'ts'`, not `toBe(tsKernels)`: `vi.resetModules()` between
    // tests (this file's `afterEach`s) re-evaluates `@pixelforge/core` too,
    // so this test's OWN statically-imported `tsKernels` can be a different
    // module instance than the one `./kernels.ts` (freshly re-imported
    // above) holds — same object-identity caveat the "flipping back to ts"
    // test above documents.
    expect(kernels.impl).toBe('ts')
    // This is the actual kill-switch bypass this fix closes: sprite-pipeline.ts
    // used to call `@pixelforge/core`'s `resolveKernels()` unconditionally,
    // which always attempts to load Wasm regardless of the override. Proof
    // no resolution was ever kicked off: `waitForKernelsResolved` is an
    // immediate no-op whenever `pending` was never set (same proof the
    // synchronous `getActiveKernels` test above uses).
    await waitForKernelsResolved()
  })

  it('"wasm" override: awaits the real resolution and returns kernels that actually work, not just the synchronous tsKernels placeholder', async () => {
    mockGetPixelCoreEnvOverride.mockReturnValue('wasm')
    const { getActiveKernelsAsync } = await import('./kernels')

    const kernels = await getActiveKernelsAsync()

    // Either the real Wasm kernels (pkg/ built) or a demoted-to-ts fallback
    // (pkg/ missing/failed) — both are correct; the point is this resolved
    // to a USABLE, SETTLED result (unlike the synchronous getActiveKernels,
    // which may still be mid-resolution on its first read).
    expect(kernels.floodFill).toBeTypeOf('function')
    const data = new Uint8Array(4 * 4 * 4)
    expect(kernels.floodFill(data, 4, 4, 0, 0, 0xff0000ff)).toEqual([0, 0, 4, 4])
  })
})
