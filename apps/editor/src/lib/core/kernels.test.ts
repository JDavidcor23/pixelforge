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
