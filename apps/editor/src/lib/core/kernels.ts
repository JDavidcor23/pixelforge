import { resolveKernels, tsKernels, type PixelKernels } from '@pixelforge/core'
import { resolveCoreImpl } from './core-config'

/**
 * Phase 5: the first place `apps/editor` actually calls into
 * `@pixelforge/core`'s `PixelKernels` from the live dispatch path (`fill` in
 * `ts-core.ts`). `dispatchCommand` is, and must stay, SYNCHRONOUS — every
 * slice/hook in this app already depends on that — but `resolveKernels()`
 * (from `@pixelforge/core`) is async: it may need to `import()`/`fetch` the
 * Wasm module the first time it runs. This module bridges the two: it keeps
 * a synchronous "currently active" `PixelKernels` reference that starts as
 * `tsKernels` (always correct, always available with zero async work) and
 * swaps over to whatever `resolveKernels()` decided (Wasm, or `tsKernels`
 * again if the Wasm module failed to load) once that promise settles.
 *
 * Honors the SAME override chain as the rest of the core boundary
 * (`core-config.ts`'s `resolveCoreImpl`: `pf:core` localStorage override ->
 * `VITE_PIXEL_CORE` env var -> default `'ts'`). Unlike the full `PixelCore`
 * (`resolveCore()`, still TS-only until phase 7), the override is re-read on
 * EVERY call here — flipping `pf:core` back to `'ts'` at runtime takes effect
 * on the very next `fill` dispatch, with no reload needed (design.md's
 * rollback-without-a-redeploy rollout note), and when it reads anything
 * other than `'wasm'` this function never even starts loading the Wasm
 * module.
 */
let active: PixelKernels = tsKernels
let pending: Promise<void> | null = null

function ensureWasmResolving(): void {
  if (pending) return
  pending = resolveKernels()
    .then((kernels) => {
      active = kernels
    })
    .catch((error) => {
      // resolveKernels() already falls back to tsKernels internally on a
      // load failure — this catch only guards against resolveKernels()
      // itself rejecting unexpectedly, so a dispatch never sees an unhandled
      // rejection surface from kernel resolution.
      console.error('[kernels] resolveKernels() rejected unexpectedly — staying on the TS reference kernels.', error)
    })
}

/**
 * The currently active `PixelKernels` — SYNCHRONOUS, safe to call from
 * `dispatchCommand`. Returns `tsKernels` immediately whenever the override
 * isn't `'wasm'`, or until a `'wasm'` override's async resolution finishes
 * (automatic TS fallback on load failure or a runtime trap is handled inside
 * `resolveKernels()`/`withRuntimeTrapFallback` — this function just reflects
 * whatever that decided).
 */
export function getActiveKernels(): PixelKernels {
  if (resolveCoreImpl() !== 'wasm') return tsKernels
  ensureWasmResolving()
  return active
}

/** Test-only: lets a test `await` the in-flight Wasm resolution before asserting which kernels are active — production dispatch stays synchronous and never awaits this. */
export function waitForKernelsResolved(): Promise<void> {
  return pending ?? Promise.resolve()
}

/** Test-only: resets the module-level cache between test cases. */
export function resetActiveKernelsForTests(): void {
  active = tsKernels
  pending = null
}
