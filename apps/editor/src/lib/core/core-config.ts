import type { DocSnapshot } from './ts-core'
import { TsPixelCore, type PixelCore } from './pixel-core'
import { getPixelCoreEnvOverride } from '@/config/env'

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
 * Builds the active `PixelCore` implementation. `'wasm'` has no backing
 * `PixelCore` (document/history) implementation yet (phase 7) — falls back
 * to `TsPixelCore` and logs via `console.error` ONCE, per design.md's
 * rollout note ("Wasm init failure falls back to TS and logs with
 * `console.error`"). This is unrelated to `PixelKernels` (flood-fill, etc.),
 * which already has a Wasm implementation as of phase 5 — see
 * `lib/core/kernels.ts`. Ids are no longer injected here (Wasm-boundary
 * blocker B4, closed) — call `setIdSeed` from `lib/core/ts-core.ts` directly
 * if a deterministic id sequence is needed (tests only; production never
 * needs one).
 */
export function resolveCore(doc: DocSnapshot): PixelCore {
  const impl = resolveCoreImpl()
  if (impl === 'wasm' && !loggedWasmPixelCoreFallback) {
    loggedWasmPixelCoreFallback = true
    console.error(
      '[pixel-core] "wasm" PixelCore (document/history) requested but not implemented yet (lands in phase 7) — falling back to "ts". Note: PixelKernels (flood-fill and other per-op kernels) already run on Wasm when available, independently of this flag — see lib/core/kernels.ts.'
    )
  }
  return new TsPixelCore(doc)
}
