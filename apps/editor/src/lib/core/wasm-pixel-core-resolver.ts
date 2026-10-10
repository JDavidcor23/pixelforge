import { loadWasmModule, WasmPixelCore } from '@pixelforge/core'
import type { Command, DispatchResult } from './commands'
import { payloadToDoc, type DocSnapshot } from './ts-core'
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

function isWasmRuntimeError(error: unknown): boolean {
  return typeof WebAssembly !== 'undefined' && error instanceof WebAssembly.RuntimeError
}

/**
 * Wraps a live `WasmPixelCore` so a `WebAssembly.RuntimeError` thrown by ANY
 * method (not just a stateless kernel call — this is the STATEFUL document,
 * so a trap here is a bigger deal) demotes this instance to `TsPixelCore`
 * for the rest of the session, recovering the last-good document content via
 * `exportDocument()` BEFORE abandoning the trapped Wasm instance (verified by
 * `wasm-pixel-core-resolver.test.ts`: a simulated trap mid-session, followed
 * by a successful `exportDocument()` on the recovered `TsPixelCore`
 * containing the pre-trap content).
 *
 * KNOWN LIMITATION (documented, not hidden): the ONE command whose call
 * actually trapped is NOT retried against the recovered `TsPixelCore` — its
 * effect is lost, not replayed (replaying it would mean re-deriving the
 * exact `Command` that was in flight, which this wrapper does not retain).
 * Every document mutation BEFORE the trap is preserved (via the recovered
 * export); the trapped command's own caller sees the exception and should
 * treat it as "that one edit did not apply" (e.g. the store's existing
 * command-dispatch error handling), not as silent data loss across the rest
 * of the document. The design doc's "else from the store's pixel cache"
 * secondary fallback (for the case where `exportDocument()` ALSO fails after
 * the trap — a Wasm instance whose memory is corrupted beyond its own
 * metadata) is NOT implemented in this phase: `core.slice.ts` would need to
 * supply its pixel cache into this module, which is out of this phase's
 * scope/risk budget — tracked in `HANDOFF.md`.
 */
class TrapSafePixelCore implements PixelCore {
  readonly impl = 'wasm' as const
  private active: PixelCore
  private demoted = false

  constructor(private readonly wasm: PixelCore) {
    this.active = wasm
  }

  private demoteToTs(error: unknown): void {
    if (this.demoted) return
    this.demoted = true
    console.error('[pixel-core] a Wasm PixelCore call trapped (WebAssembly.RuntimeError) — switching to the TS reference implementation for the rest of this session.', error)
    let recovered: DocumentPayload | null = null
    try {
      recovered = this.wasm.exportDocument()
    } catch (exportError) {
      console.error(
        '[pixel-core] WasmPixelCore trapped AND its own exportDocument() also failed afterward — no last-good Wasm state to recover from this session. The document in memory may now be stale; the user should save/reopen.',
        exportError
      )
    }
    this.active = recovered ? new TsPixelCore(payloadToDoc(recovered)) : this.active
  }

  private guard<R>(fn: (core: PixelCore) => R): R {
    const core = this.active
    try {
      return fn(core)
    } catch (error) {
      if (!isWasmRuntimeError(error)) throw error
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
 * ONLY if the Wasm module happens to already be loaded this session (e.g.
 * `lib/core/kernels.ts` warmed it earlier, or a previous `resolveCore()`
 * call did). Otherwise returns `null` and kicks off a background load so a
 * LATER `resolveCore()` call in this session can use it — `resolveCore()`
 * itself must stay synchronous (every `core.slice.ts` caller depends on
 * this), so a cold Wasm load can never block opening a document.
 */
export function tryResolveWasmPixelCore(doc: DocSnapshot): PixelCore | null {
  if (!cachedModule) {
    ensureModuleLoading()
    return null
  }
  try {
    return new TrapSafePixelCore(new WasmPixelCore(cachedModule, doc))
  } catch (error) {
    console.error('[pixel-core] WasmPixelCore construction failed — falling back to TsPixelCore for this session.', error)
    return null
  }
}
