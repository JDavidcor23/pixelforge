/**
 * W6 (phase 4f, judgment-day): exercises the PRODUCTION wasm loader
 * end to end, not a simplified test-only path — `resolveKernels()` ->
 * `loadWasmModule()` -> the real `pkg/pixelforge_core.js` dynamic import,
 * same code every real call site uses. The only injected seam is HOW the
 * already-imported glue module gets initialized (`initWasm`, `wasm-core.ts`)
 * — production calls `mod.default()` (the glue's own `fetch`), this suite
 * calls `mod.initSync({ module: readFileSync(...) })` because Node has no
 * universally-working relative-URL `fetch` for a local file across every
 * environment this suite might run in.
 *
 * Also covers the two fallback paths design.md's `resolveKernels` doc
 * promises: LOAD failure -> TS kernels, and a RUNTIME trap mid-session ->
 * TS kernels for the rest of the session (W6).
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveKernels, resetLoadFailureLogForTests, resetRuntimeTrapDemotionForTests, withRuntimeTrapFallback } from './resolve-core'
import { loadWasmModule, resetWasmModuleForTests } from './wasm-core'
import { tsKernels } from './ts-core'

const here = dirname(fileURLToPath(import.meta.url))
const wasmPath = join(here, '..', 'pkg', 'pixelforge_core_bg.wasm')
const pkgAvailable = existsSync(wasmPath)

beforeEach(() => {
  resetWasmModuleForTests()
  resetRuntimeTrapDemotionForTests()
  resetLoadFailureLogForTests()
})
afterEach(() => {
  resetWasmModuleForTests()
  resetRuntimeTrapDemotionForTests()
  resetLoadFailureLogForTests()
  vi.restoreAllMocks()
})

// IMPORTANT — ordering (Vitest runs tests within one file in declaration
// order, no isolation between `it`s in the same file): this describe block
// MUST run FIRST. The generated wasm-bindgen glue module (`pkg/
// pixelforge_core.js`) caches its OWN internal Wasm instance at the MODULE
// level (`initSync`'s own `if (wasm !== undefined) return wasm` guard) —
// ES module imports are cached by specifier, so once ANY test in this file
// calls `initSync` on it, every LATER `mod.default()` call in the same
// process sees an already-warm module and succeeds immediately, even with
// zero network/filesystem access. `resetWasmModuleForTests()` only clears
// THIS package's own wrapper variable, not the glue's internal one — there
// is no way to re-test "the module fails to load" after something else in
// the same file has already warmed it.
describe('fallback to TS on load failure (W6)', () => {
  it('resolveKernels falls back to tsKernels, logging via console.error, when the wasm module fails to load', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    // No pkg/ pre-warm, and the production `loadWasmModule()` path only
    // succeeds in a real browser (its default init calls `fetch` against a
    // relative `pixelforge_core_bg.wasm` URL) — under plain Node with
    // nothing pre-warmed, that `fetch` rejects (no server to answer it),
    // which is exactly the "the module fails to load for any reason" case
    // this test targets. Confirmed empirically (this assertion is NOT a
    // tautology): without this fix it would resolve to 'wasm' instead.
    const kernels = await resolveKernels()
    expect(kernels.impl).toBe('ts')
    expect(kernels).toBe(tsKernels)
    expect(errorSpy).toHaveBeenCalled()
  })

  it('fix-agent 6f.2 (W-B): a second resolveKernels() call after a failed load does not retry the load or log again — no retry storm, log once', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const first = await resolveKernels()
    const second = await resolveKernels()

    expect(first).toBe(tsKernels)
    expect(second).toBe(tsKernels)
    // Before this fix, `loadWasmModule` never cached a failure, so EVERY
    // call re-attempted the (failing) production fetch and `resolveKernels`
    // logged once PER CALL — confirmed this would be `2` without the fix.
    expect(errorSpy).toHaveBeenCalledTimes(1)
  })
})

describe.skipIf(!pkgAvailable)('loadWasmModule concurrency (fix-agent 6f.2, verify-report-phase-6.md W-B)', () => {
  it('two concurrent first callers share ONE in-flight instantiation, not a separate one each', async () => {
    let initCalls = 0
    const countingInit: Parameters<typeof loadWasmModule>[0] = (mod) => {
      initCalls += 1
      return mod.initSync({ module: readFileSync(wasmPath) })
    }

    // Before this fix, `loadWasmModule`'s `if (!wasmModule)` check and its
    // `wasmModule = mod` write straddled two `await`s with no in-flight-
    // promise guard — two callers that both start before either finishes
    // each independently re-imported/re-initialized the module.
    const [a, b] = await Promise.all([loadWasmModule(countingInit), loadWasmModule(countingInit)])

    expect(a).toBe(b)
    expect(initCalls).toBe(1)
  })
})

describe.skipIf(!pkgAvailable)('production wasm loader (W6)', () => {
  it('loadWasmModule, given the Node-only init strategy, loads the SAME generated glue production imports', async () => {
    const mod = await loadWasmModule((m) => m.initSync({ module: readFileSync(wasmPath) }))
    expect(typeof mod.put_points).toBe('function')
    expect(typeof mod.extract_rect).toBe('function')
  })

  it('resolveKernels resolves to the wasm implementation when the production-shaped loader succeeds', async () => {
    // Pre-warm the module cache using the Node init strategy, exactly like a
    // real app would pre-warm it once at startup — `resolveKernels()` itself
    // always calls the production `loadWasmModule()` (no args), so this
    // proves the "once loaded, resolveKernels picks it up" half of the
    // contract without needing resolveKernels to itself know about Node.
    await loadWasmModule((m) => m.initSync({ module: readFileSync(wasmPath) }))
    const kernels = await resolveKernels()
    expect(kernels.impl).toBe('wasm')
  })
})

describe('runtime trap fallback (W6)', () => {
  it('a WebAssembly.RuntimeError from a kernel call demotes the session to TS kernels, logging via console.error', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // A real Rust panic is unreachable from JS input by design (W2/W3
    // hardening) — the wasm-bindgen glue module is also a frozen ES module
    // namespace (its exports can't be monkey-patched to force a real trap),
    // so `withRuntimeTrapFallback` (the exact function `resolveKernels`
    // wires in) is exercised directly against a plain fake `PixelKernels`
    // whose `putPoints` throws a genuine `WebAssembly.RuntimeError` — the
    // one thing the guard actually inspects to decide "this is a trap, not
    // some other bug".
    const trappingWasm = { ...tsKernels, impl: 'wasm' as const, putPoints: () => { throw new WebAssembly.RuntimeError('simulated trap') } }
    const guarded = withRuntimeTrapFallback(trappingWasm)

    const written = guarded.putPoints(new Uint8Array(4 * 4 * 4), 4, 4, new Int32Array([0, 0]), 0xffffffff)
    expect(written).toBe(1) // the TS fallback still did the real work
    expect(errorSpy).toHaveBeenCalled()

    // "for the rest of the session": a DIFFERENT `withRuntimeTrapFallback`-
    // wrapped kernels object, and `resolveKernels()` itself, must both be
    // demoted now — not just the instance that originally trapped.
    const anotherGuarded = withRuntimeTrapFallback(trappingWasm)
    expect(anotherGuarded.cloneBuffer).not.toThrow
  })

  it('demotes resolveKernels() to tsKernels for the rest of the session, across separate calls', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const trappingWasm = { ...tsKernels, impl: 'wasm' as const, putPoints: () => { throw new WebAssembly.RuntimeError('simulated trap') } }
    withRuntimeTrapFallback(trappingWasm).putPoints(new Uint8Array(16), 2, 2, new Int32Array([0, 0]), 0xffffffff)
    expect(errorSpy).toHaveBeenCalled()

    const kernelsAfterTrap = await resolveKernels()
    expect(kernelsAfterTrap.impl).toBe('ts')
    expect(kernelsAfterTrap).toBe(tsKernels)
  })
})
