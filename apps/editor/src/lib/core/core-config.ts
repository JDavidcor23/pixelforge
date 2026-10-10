import type { DocSnapshot } from './ts-core'
import { TsPixelCore, type PixelCore } from './pixel-core'
import { getPixelCoreEnvOverride } from '@/config/env'
import { tryResolveWasmPixelCore } from './wasm-pixel-core-resolver'

/**
 * Implementation switch (phase 2e, design.md: "Flag: `resolveCore()` reads
 * the localStorage override `pf:core` ... then the env var ... then
 * defaults to `'ts'`"). Only `'ts'` exists until phase 4+; `'wasm'` is
 * accepted as a VALUE (so the override/env var round-trips cleanly once a
 * Wasm core lands) but always falls back to `'ts'` today, loudly.
 *
 * Phase 3 update: the app is Vite now — env is read through THIS small
 * module on purpose, so the move only touched `readEnvOverride` below
 * (`NEXT_PUBLIC_PIXEL_CORE` -> `import.meta.env.VITE_PIXEL_CORE`), not every
 * call site that cares which core implementation is active.
 */
export const PIXEL_CORE_OVERRIDE_KEY = 'pf:core'

export type PixelCoreImpl = 'ts' | 'wasm'

function isPixelCoreImpl(value: string | null): value is PixelCoreImpl {
  return value === 'ts' || value === 'wasm'
}

/** Vite env var (phase 3 — was `process.env.NEXT_PUBLIC_PIXEL_CORE` under Next.js), read through `config/env.ts` (phase 3 cleanup: the one place this app reads `import.meta.env`). */
function readEnvOverride(): PixelCoreImpl | null {
  const value = getPixelCoreEnvOverride()
  return isPixelCoreImpl(value) ? value : null
}

function readLocalStorageOverride(): PixelCoreImpl | null {
  if (typeof window === 'undefined') return null
  try {
    const value = window.localStorage.getItem(PIXEL_CORE_OVERRIDE_KEY)
    return isPixelCoreImpl(value) ? value : null
  } catch {
    return null // localStorage unavailable (SSR, private mode, quota) — fall through to the env var/default
  }
}

export function resolveCoreImpl(): PixelCoreImpl {
  return readLocalStorageOverride() ?? readEnvOverride() ?? 'ts'
}

/**
 * Fix-agent 5f.7: the previous log text ("no Wasm implementation exists yet")
 * was true of `PixelCore` (the full document/history boundary this file
 * resolves — still `TsPixelCore`-only, phase 7's job) but READS as a claim
 * that NOTHING in `@pixelforge/core` is Wasm-backed, which has been false
 * since phase 5: `lib/core/kernels.ts`'s `getActiveKernels()` already wires a
 * real Rust/Wasm `floodFill` kernel into `dispatchCommand`'s live `fill`
 * case, independently of this flag. Logged at most ONCE per page session
 * (not once per `resolveCore()` call, e.g. every `ensureCore()`/
 * `importDocument()` — see `core.slice.ts`) since the override doesn't
 * change between calls within a session.
 */
let loggedWasmPixelCoreFallback = false

/** Test-only: lets a test re-exercise the once-per-session log without a full module reset between cases. */
export function resetWasmPixelCoreFallbackLogForTests(): void {
  loggedWasmPixelCoreFallback = false
}

/**
 * Builds the active `PixelCore` implementation. `'wasm'` (phase 7): attempts
 * a trap-safe `WasmPixelCore` (`lib/core/wasm-pixel-core-resolver.ts`) —
 * returns it ONLY if the Wasm module happens to already be loaded this
 * session (this function must stay SYNCHRONOUS, `core.slice.ts` depends on
 * it), otherwise kicks off a background load and falls back to
 * `TsPixelCore` for THIS document (a later `resolveCore()` call in the same
 * session may get Wasm once loading finishes). Any construction failure
 * ALSO falls back to `TsPixelCore`, logged once via `console.error`, per
 * design.md's rollout note. DEFAULT STAYS `'ts'` — `resolveCoreImpl()` only
 * returns `'wasm'` when the user (or a test) explicitly set the `pf:core`
 * override or `VITE_PIXEL_CORE` env var; flipping the default is a decision
 * for AFTER full manual browser testing (see design.md's "Current status
 * & follow-ups" section), not something this function does on its own.
 *
 * Phase 7f CRITICAL #1 fix: this function being synchronous used to mean the
 * Wasm module was NEVER loaded by the time the very first `ensureCore()`
 * call in a session happened, so `'wasm'` silently never activated. The fix
 * lives OUTSIDE this function — `services/document-persistence.controller.ts`
 * now `await`s `wasm-pixel-core-resolver.ts`'s `waitForWasmModule()` during
 * the existing `docStatus: 'loading'` gate, BEFORE the canvas becomes
 * interactive and before the restored draft is imported — so by the time
 * anything calls `resolveCore()`, the module has already finished loading
 * (or failed) and `tryResolveWasmPixelCore` can return a real decision
 * instead of a guaranteed `null`. This function itself is unchanged for the
 * `'ts'` path (still synchronous, still zero overhead).
 *
 * `getRecoverySnapshot` (phase 7f CRITICAL #2) is forwarded to
 * `tryResolveWasmPixelCore` so a mid-session Wasm trap can rebuild a
 * `TsPixelCore` from the caller's own last-good state instead of calling
 * back into the poisoned Wasm instance — see `wasm-pixel-core-resolver.ts`'s
 * `TrapSafePixelCore` doc.
 */
export function resolveCore(doc: DocSnapshot, getRecoverySnapshot: () => DocSnapshot): PixelCore {
  const impl = resolveCoreImpl()
  if (impl === 'wasm') {
    const wasmCore = tryResolveWasmPixelCore(doc, getRecoverySnapshot)
    if (wasmCore) return wasmCore
    if (!loggedWasmPixelCoreFallback) {
      loggedWasmPixelCoreFallback = true
      console.error(
        '[pixel-core] "wasm" PixelCore requested but the Wasm module is not loaded (yet, or failed to load) this session — falling back to "ts" for this document. A later resolveCore() call may pick up Wasm once background loading finishes.'
      )
    }
  }
  return new TsPixelCore(doc)
}
