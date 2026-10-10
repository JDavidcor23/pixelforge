import { loadWasmModule, WasmPixelCore } from '@pixelforge/core'
import type { Command, DispatchResult } from './commands'
import type { DocSnapshot } from './ts-core'
import { TsPixelCore, type DocMetaSnapshot, type PixelCore } from './pixel-core'
import type { DocumentPayload } from '@/types/document'

/**
 * Phase 7: bridges `resolveCore()`'s SYNCHRONOUS contract (every `core.slice.ts`
 * caller depends on this staying sync — same reason `lib/core/kernels.ts`'s
 * `getActiveKernels()` exists for `PixelKernels`) with `@pixelforge/core`'s
 * ASYNC module loader. Mirrors `kernels.ts`'s shape closely: a module-level
 * cached module + an in-flight promise, `tryResolveWasmPixelCore` returns
 * `null` immediately (and kicks off a background load for NEXT time) unless
 * the module happens to already be loaded.
 */
let cachedModule: Awaited<ReturnType<typeof loadWasmModule>> | null = null
let pending: Promise<void> | null = null

function ensureModuleLoading(): void {
  if (pending || cachedModule) return
  pending = loadWasmModule()
    .then((mod) => {
      cachedModule = mod
    })
    .catch((error: unknown) => {
      console.error('[pixel-core] Wasm module failed to load for the full PixelCore (document/history) boundary — staying on TsPixelCore for this session.', error)
    })
}

/** Test-only: forgets the cached module/in-flight state between test cases. */
export function resetWasmPixelCoreResolverForTests(): void {
  cachedModule = null
  pending = null
}

/**
 * Phase 7f (CRITICAL #1 — "the flag is dead"): `resolveCore()` must stay
 * SYNCHRONOUS (every `core.slice.ts` caller depends on it), but `core` is
 * bootstrapped exactly ONCE, lazily, the first time the store is touched
 * (`ensureCore()`). Without this, that FIRST call always lands before the
 * background `loadWasmModule()` kicked off by `ensureModuleLoading()` has a
 * chance to resolve, so `tryResolveWasmPixelCore` always returns `null` the
 * one time it's ever asked, and the store permanently falls back to
 * `TsPixelCore` for the rest of the session even with `pf:core=wasm` set —
 * no LATER call ever re-checks.
 *
 * The fix is NOT to make `resolveCore()` async — it's to await THIS function
 * once, earlier, during the existing `docStatus: 'loading'` gate
 * (`services/document-persistence.controller.ts`), before the canvas becomes
 * interactive and before the restored draft is imported into the core. By
 * the time `docStatus` flips to `'ready'`, `cachedModule` is already
 * populated (success OR failure) and the FIRST `ensureCore()` call — whether
 * triggered by `importDocument` during restore or by the user's first
 * `dispatch` afterward — gets a real decision instead of a guaranteed `null`.
 *
 * Resolves immediately (no microtask delay beyond what's already pending) if
 * the module is already cached; never rejects (a load failure is already
 * caught and logged by `ensureModuleLoading`).
 */
export async function waitForWasmModule(): Promise<void> {
  if (cachedModule) return
  ensureModuleLoading()
  if (pending) await pending
}

function describeTrap(error: unknown): string {
  return typeof WebAssembly !== 'undefined' && error instanceof WebAssembly.RuntimeError
    ? 'a genuine WebAssembly.RuntimeError (the instance trapped)'
    : 'a non-RuntimeError exception (phase 7f: treated as fatal-poison too — see class doc)'
}

/**
 * Wraps a live `WasmPixelCore` so ANY exception thrown by ANY method (not
 * just a stateless kernel call — this is the STATEFUL document, so a trap
 * here is a bigger deal) demotes this instance to `TsPixelCore` for the rest
 * of the session.
 *
 * Phase 7f (CRITICAL #2, rewritten from the phase 7 design):
 * - **Any exception is poison, not just `WebAssembly.RuntimeError`.** A real
 *   trap leaves wasm-bindgen's generated glue with its "this object is
 *   currently borrowed" flag stuck (a trap skips the normal call-return
 *   bookkeeping that clears it) — EVERY subsequent call on the SAME JS
 *   handle then throws a plain `Error: recursive use of an object detected
 *   which is already borrowed`, never another `RuntimeError`. Gating
 *   recovery on `instanceof WebAssembly.RuntimeError` missed this entirely:
 *   the FIRST call after a trap (frequently the recovery attempt itself)
 *   would see a plain `Error` and skip demotion, leaving the caller stuck
 *   calling a permanently-dead object forever.
 * - **Recovery never calls into the dead core.** The old design recovered
 *   via `this.wasm.exportDocument()` — itself a call into the poisoned
 *   object, guaranteed to throw too. Recovery now rebuilds a `TsPixelCore`
 *   from a caller-supplied snapshot of the LAST SUCCESSFUL dispatch
 *   (`getRecoverySnapshot`, backed by `core.slice.ts`'s own zustand state —
 *   the metadata + pixel cache written back after every prior `dispatch`),
 *   never touching `this.wasm` again after the trap.
 * - **Undo history is dropped.** `getRecoverySnapshot()` returns a
 *   `DocSnapshot` (no history), so the rebuilt `TsPixelCore` starts with
 *   `canUndo`/`canRedo` both `false` — the pre-trap undo stack lived only
 *   inside the now-abandoned Wasm instance and cannot be recovered. This is
 *   an intentional, documented tradeoff (see `HANDOFF.md`), not a bug.
 * - **The failing command is not applied.** The trapped call still rethrows
 *   (see `guard` below) — the caller's `dispatch(cmd)` for that ONE command
 *   throws and no content/history change from it is observable anywhere.
 *   `core.slice.ts` catches this, syncs the UI from the recovered core, and
 *   requests an immediate autosave flush so the pre-trap content (which IS
 *   fully preserved) hits the repository right away instead of waiting for
 *   the debounce.
 */
class TrapSafePixelCore implements PixelCore {
  readonly impl = 'wasm' as const
  private active: PixelCore
  private demoted = false

  constructor(
    private readonly wasm: PixelCore,
    private readonly getRecoverySnapshot: () => DocSnapshot
  ) {
    this.active = wasm
  }

  private demoteToTs(error: unknown): void {
    if (this.demoted) return
    this.demoted = true
    console.error(
      `[pixel-core] a Wasm PixelCore call threw ${describeTrap(error)} — switching to the TS reference implementation for the rest of this session. Undo history is reset; all document content up to the last successful dispatch is preserved.`,
      error
    )
    // Never call back into `this.wasm` here — it is poisoned and every
    // method on it now throws (see class doc). The recovery source is the
    // CALLER's own last-good state, not this trapped instance.
    this.active = new TsPixelCore(this.getRecoverySnapshot())
  }

  private guard<R>(fn: (core: PixelCore) => R): R {
    const core = this.active
    try {
      return fn(core)
    } catch (error) {
      if (this.demoted) throw error // already recovered — this is a genuine TsPixelCore error, not a new trap; propagate as-is.
      this.demoteToTs(error)
      throw error // this ONE call's command is lost (see class doc) — the caller's NEXT call reaches `this.active`, now TsPixelCore, trap-free.
    }
  }

  dispatch(cmd: Command): DispatchResult {
    return this.guard((core) => core.dispatch(cmd))
  }

  undo(): DispatchResult {
    return this.guard((core) => core.undo())
  }

  redo(): DispatchResult {
    return this.guard((core) => core.redo())
  }

  readLayer(frameId: string, layerId: string): Uint8ClampedArray {
    return this.guard((core) => core.readLayer(frameId, layerId))
  }

  snapshot(): DocMetaSnapshot {
    return this.guard((core) => core.snapshot())
  }

  exportDocument(): DocumentPayload {
    return this.guard((core) => core.exportDocument())
  }

  importDocument(doc: DocumentPayload): void {
    this.guard((core) => core.importDocument(doc))
  }

  get canUndo(): boolean {
    return this.active.canUndo
  }

  get canRedo(): boolean {
    return this.active.canRedo
  }
}

/**
 * Synchronous: returns a trap-safe `PixelCore` backed by `WasmPixelCore`
 * ONLY if the Wasm module happens to already be loaded this session — thanks
 * to {@link waitForWasmModule} being awaited during the `docStatus:
 * 'loading'` gate (phase 7f CRITICAL #1), that's true by the time anything
 * can call this in practice. Otherwise returns `null` and kicks off a
 * background load so a LATER `resolveCore()` call in this session can use it
 * — `resolveCore()` itself must stay synchronous (every `core.slice.ts`
 * caller depends on this), so a cold Wasm load can never block opening a
 * document.
 *
 * `getRecoverySnapshot` (phase 7f CRITICAL #2) is threaded into the returned
 * `TrapSafePixelCore` so a mid-session trap can rebuild a `TsPixelCore`
 * WITHOUT calling back into the now-poisoned Wasm instance — see that
 * class's doc.
 */
export function tryResolveWasmPixelCore(doc: DocSnapshot, getRecoverySnapshot: () => DocSnapshot): PixelCore | null {
  if (!cachedModule) {
    ensureModuleLoading()
    return null
  }
  try {
    return new TrapSafePixelCore(new WasmPixelCore(cachedModule, doc), getRecoverySnapshot)
  } catch (error) {
    console.error('[pixel-core] WasmPixelCore construction failed — falling back to TsPixelCore for this session.', error)
    return null
  }
}
