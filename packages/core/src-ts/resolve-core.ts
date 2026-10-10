import { tsKernels } from './ts-core'
import { loadWasmModule, makeWasmKernels } from './wasm-core'
import type { PixelKernels } from './types'

/**
 * W6 (phase 4f, judgment-day): once a REAL Wasm trap (`WebAssembly.
 * RuntimeError`) is caught from any kernel call, this flips permanently —
 * every kernel call for the rest of the page session goes straight to
 * `tsKernels`, never attempting Wasm again. Module-level (not per-
 * `PixelKernels` instance) on purpose: `resolveKernels()` can be called more
 * than once (each `PixelCore`/document import re-resolves its kernels), and
 * a trap discovered by one caller must demote every OTHER caller too — a
 * Wasm instance that just trapped is not something a DIFFERENT consumer
 * should keep trusting either.
 */
let demotedToTsForSession = false

function isWasmRuntimeError(error: unknown): boolean {
  return typeof WebAssembly !== 'undefined' && error instanceof WebAssembly.RuntimeError
}

/**
 * Wraps every `PixelKernels` method so a `WebAssembly.RuntimeError` thrown
 * during the call is caught, logged, and answered by re-running the SAME
 * call against `tsKernels` instead — and flips {@link demotedToTsForSession}
 * so every LATER call (this instance or any other `resolveKernels()` result)
 * skips Wasm entirely from then on. Any OTHER kind of thrown error (a bug
 * unrelated to a Wasm trap) is rethrown unchanged — this facade only ever
 * catches the one specific failure mode it knows how to recover from.
 */
/** Exported for `resolve-core.test.ts` only — NOT part of this package's public `index.ts` surface. Lets the test simulate a trap against a plain fake `PixelKernels` object instead of mutating the real (frozen) ES module namespace wasm-bindgen generates. */
export function withRuntimeTrapFallback(wasm: PixelKernels): PixelKernels {
  function guard<Args extends unknown[], R>(wasmFn: (...args: Args) => R, tsFn: (...args: Args) => R): (...args: Args) => R {
    return (...args: Args): R => {
      if (demotedToTsForSession) return tsFn(...args)
      try {
        return wasmFn(...args)
      } catch (error) {
        if (!isWasmRuntimeError(error)) throw error
        console.error(
          '[pixelforge-core] a Wasm kernel call trapped (WebAssembly.RuntimeError) — switching to the TS reference implementation for the rest of this session.',
          error
        )
        demotedToTsForSession = true
        return tsFn(...args)
      }
    }
  }

  return {
    impl: 'wasm',
    putPoints: guard(wasm.putPoints.bind(wasm), tsKernels.putPoints),
    floodFill: guard(wasm.floodFill.bind(wasm), tsKernels.floodFill),
    cloneBuffer: guard(wasm.cloneBuffer.bind(wasm), tsKernels.cloneBuffer),
    diffRect: guard(wasm.diffRect.bind(wasm), tsKernels.diffRect),
    extractRect: guard(wasm.extractRect.bind(wasm), tsKernels.extractRect),
    writeRect: guard(wasm.writeRect.bind(wasm), tsKernels.writeRect),
    bytesEqual: guard(wasm.bytesEqual.bind(wasm), tsKernels.bytesEqual),
  }
}

/** Test-only: resets the session-wide trap-demotion flag between test cases. */
export function resetRuntimeTrapDemotionForTests(): void {
  demotedToTsForSession = false
}

/**
 * Builds the active `PixelKernels` implementation. Tries Wasm first; falls
 * back to the TS reference kernels (always correct, always available) if the
 * Wasm module fails to LOAD for any reason — logged via `console.error`,
 * never thrown (matches `apps/editor/src/lib/core/core-config.ts`'s
 * `resolveCore` fallback philosophy for the full `PixelCore`). Once loaded,
 * every call is wrapped so a RUNTIME trap (not a load failure) ALSO falls
 * back to TS, for the rest of the session (W6) — see
 * `withRuntimeTrapFallback`.
 */
export async function resolveKernels(): Promise<PixelKernels> {
  if (demotedToTsForSession) return tsKernels
  try {
    const mod = await loadWasmModule()
    return withRuntimeTrapFallback(makeWasmKernels(mod))
  } catch (error) {
    console.error('[pixelforge-core] Wasm kernels failed to load — falling back to the TS reference implementation.', error)
    return tsKernels
  }
}
