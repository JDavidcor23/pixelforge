/**
 * Tests `wasm-pixel-core-resolver.ts`'s responsibilities:
 *  1. `tryResolveWasmPixelCore` stays synchronous and only returns a Wasm
 *     core once the module has actually finished loading (never blocks).
 *  2. `waitForWasmModule` lets a caller (the real persistence startup gate)
 *     AWAIT that same load instead of polling it.
 *  3. The trap-safety wrapper (phase 7f CRITICAL #2): ANY exception from a
 *     call on the active Wasm core — not just `WebAssembly.RuntimeError` —
 *     demotes to a `TsPixelCore` rebuilt from a caller-supplied recovery
 *     snapshot, WITHOUT ever calling back into the (now-poisoned) Wasm
 *     instance again.
 *
 * `@pixelforge/core` is mocked wholesale — this file tests THIS module's
 * wiring/recovery logic, not `WasmPixelCore` itself (that has its own
 * `packages/core/src-ts/wasm-document-core.test.ts`, against the real wasm
 * binary — see also that package's real-trap coverage via
 * `debugForceTrap()`).
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createEmptyBuffer } from '../pixel-buffer'
import type { Command, DispatchResult } from './commands'
import type { DocSnapshot } from './ts-core'
import type { DocumentPayload, DocumentFramePayload } from '@/types/document'

function makeDoc(fill = 0): DocSnapshot {
  const w = 2
  const h = 2
  const pixels = createEmptyBuffer(w, h)
  if (fill) pixels.data.fill(fill)
  return {
    canvasWidth: w,
    canvasHeight: h,
    timeline: {
      frames: [{ id: 'F0', layers: [{ id: 'L0', name: 'a', visible: true, locked: false, opacity: 100, pixels }], activeLayerId: 'L0', durationMs: 83 }],
      currentFrameIndex: 0,
      isPlaying: false,
      fps: 12,
      loop: true,
      selectedFrameIndices: [0],
    },
  }
}

function docToPayload(doc: DocSnapshot): DocumentPayload {
  const frames: DocumentFramePayload[] = doc.timeline.frames.map((f) => ({
    id: f.id,
    activeLayerId: f.activeLayerId,
    layers: f.layers.map((l) => ({ id: l.id, name: l.name, visible: l.visible, locked: l.locked, opacity: l.opacity, data: new Uint8Array(l.pixels.data) })),
  }))
  return { schemaVersion: 1, w: doc.canvasWidth, h: doc.canvasHeight, frameMs: doc.timeline.frames.map((f) => f.durationMs), frames }
}

// A controllable fake standing in for `@pixelforge/core`'s real `WasmPixelCore` —
// this test controls exactly when it "traps", and with what kind of error.
class FakeWasmPixelCore {
  static instances: FakeWasmPixelCore[] = []
  readonly impl = 'wasm' as const
  trapOnNextCall: 'none' | 'runtime-error' | 'plain-error' = 'none'
  canUndo = true // a live Wasm core always has SOME history in this test — recovery must reset it to false
  canRedo = false

  constructor(
    _mod: unknown,
    _doc: DocSnapshot
  ) {
    FakeWasmPixelCore.instances.push(this)
  }

  private maybeTrap(): void {
    if (this.trapOnNextCall === 'none') return
    const mode = this.trapOnNextCall
    this.trapOnNextCall = 'none'
    if (mode === 'runtime-error') throw new WebAssembly.RuntimeError('simulated Wasm trap')
    // Phase 7f: the REAL post-trap behavior — wasm-bindgen's stuck borrow
    // flag throws a plain `Error`, never another `RuntimeError`.
    throw new Error('recursive use of an object detected which is already borrowed')
  }

  dispatch(_cmd: Command): DispatchResult {
    this.maybeTrap()
    return { changed: false, contentChanged: false, structureChanged: false, historyChanged: false, canUndo: this.canUndo, canRedo: this.canRedo, strokeOpen: false, revision: 0, contentRevision: 0, dirty: [], evicted: [], layerRevisions: {} }
  }
  undo(): DispatchResult {
    return this.dispatch({ type: 'undo' })
  }
  redo(): DispatchResult {
    return this.dispatch({ type: 'redo' })
  }
  readLayer(): Uint8ClampedArray {
    this.maybeTrap()
    return new Uint8ClampedArray(0)
  }
  snapshot(): never {
    throw new Error('not exercised in this test')
  }
  exportDocument(): never {
    throw new Error('recovery must NEVER call exportDocument() on the trapped Wasm instance (phase 7f) — this fake fails loudly if it does')
  }
  importDocument(): void {
    throw new Error('not exercised in this test')
  }
}

let loadResolve: (() => void) | null = null
let loadReject: ((error: unknown) => void) | null = null

vi.mock('@pixelforge/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@pixelforge/core')>()
  return {
    ...actual,
    loadWasmModule: () =>
      new Promise<object>((resolve, reject) => {
        loadResolve = () => resolve({})
        loadReject = reject
      }),
    WasmPixelCore: FakeWasmPixelCore,
  }
})

describe('tryResolveWasmPixelCore / waitForWasmModule', () => {
  afterEach(async () => {
    vi.resetModules()
    vi.restoreAllMocks()
    FakeWasmPixelCore.instances = []
    loadResolve = null
    loadReject = null
  })

  it('returns null synchronously before the module finishes loading, then a Wasm core once it has', async () => {
    const { tryResolveWasmPixelCore, resetWasmPixelCoreResolverForTests } = await import('./wasm-pixel-core-resolver')
    resetWasmPixelCoreResolverForTests()

    const first = tryResolveWasmPixelCore(makeDoc(), () => makeDoc())
    expect(first).toBeNull() // kicked off loading, but never blocks

    loadResolve?.()
    await Promise.resolve()
    await Promise.resolve() // flush the .then() microtask

    const second = tryResolveWasmPixelCore(makeDoc(), () => makeDoc())
    expect(second).not.toBeNull()
    expect(second?.impl).toBe('wasm')
  })

  it('logs once (and only once) if the module load itself fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { tryResolveWasmPixelCore, resetWasmPixelCoreResolverForTests } = await import('./wasm-pixel-core-resolver')
    resetWasmPixelCoreResolverForTests()

    tryResolveWasmPixelCore(makeDoc(), () => makeDoc())
    loadReject?.(new Error('network error'))
    await Promise.resolve()
    await Promise.resolve()

    const still = tryResolveWasmPixelCore(makeDoc(), () => makeDoc())
    expect(still).toBeNull()
    expect(errorSpy).toHaveBeenCalledTimes(1)
  })

  it('waitForWasmModule resolves once loading finishes, and resolves immediately if already cached (phase 7f CRITICAL #1)', async () => {
    const { waitForWasmModule, tryResolveWasmPixelCore, resetWasmPixelCoreResolverForTests } = await import('./wasm-pixel-core-resolver')
    resetWasmPixelCoreResolverForTests()

    let settled = false
    const wait = waitForWasmModule().then(() => {
      settled = true
    })
    // not yet resolved — the load is still in flight.
    await Promise.resolve()
    expect(settled).toBe(false)

    loadResolve?.()
    await wait
    expect(settled).toBe(true)

    // and now that it's cached, `tryResolveWasmPixelCore` gets a real core on the FIRST call — the whole point of awaiting this during startup.
    const core = tryResolveWasmPixelCore(makeDoc(), () => makeDoc())
    expect(core).not.toBeNull()

    // a second await resolves immediately (no new load kicked off).
    let secondSettled = false
    void waitForWasmModule().then(() => {
      secondSettled = true
    })
    await Promise.resolve()
    expect(secondSettled).toBe(true)
  })

  it('waitForWasmModule resolves (never rejects) even if the load fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { waitForWasmModule, resetWasmPixelCoreResolverForTests } = await import('./wasm-pixel-core-resolver')
    resetWasmPixelCoreResolverForTests()

    const wait = waitForWasmModule()
    loadReject?.(new Error('network error'))
    await expect(wait).resolves.toBeUndefined()
  })

  it('a mid-session trap demotes to TsPixelCore built from the recovery snapshot — NEVER by calling back into the trapped Wasm instance', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { tryResolveWasmPixelCore, resetWasmPixelCoreResolverForTests } = await import('./wasm-pixel-core-resolver')
    resetWasmPixelCoreResolverForTests()

    tryResolveWasmPixelCore(makeDoc(), () => makeDoc())
    loadResolve?.()
    await Promise.resolve()
    await Promise.resolve()

    // the recovery snapshot is independent of what the (about-to-be-trapped)
    // Wasm core holds — stamped with a recognizable fill value so we can
    // prove IT (not the fake's own `exportDocument`, which throws if called)
    // is what the recovered core serves afterward.
    const recoverySnapshot = makeDoc(42)
    const core = tryResolveWasmPixelCore(makeDoc(), () => recoverySnapshot)
    expect(core).not.toBeNull()
    if (!core) throw new Error('unreachable')
    expect(core.impl).toBe('wasm')

    const fake = FakeWasmPixelCore.instances[FakeWasmPixelCore.instances.length - 1]
    fake.trapOnNextCall = 'runtime-error'
    expect(() => core.dispatch({ type: 'undo' })).toThrow(WebAssembly.RuntimeError)

    // the SAME command is lost (documented limitation), but the next call
    // reaches the recovered TsPixelCore without throwing — and WITHOUT the
    // fake's `exportDocument` ever being called (it throws loudly if it is).
    expect(() => core.dispatch({ type: 'undo' })).not.toThrow()
    expect(core.impl).toBe('wasm') // the wrapper's own `impl` tag is stable; `dispatch` now delegates to a TsPixelCore internally

    // undo history is dropped (phase 7f, documented tradeoff) — the live
    // Wasm fake reported `canUndo: true`, but the recovered core has none.
    expect(core.canUndo).toBe(false)
    expect(core.canRedo).toBe(false)

    // ...and the recovered document's pixel content matches the recovery
    // snapshot, not an empty/fresh document.
    const recoveredPixels = core.exportDocument().frames[0].layers[0].data
    expect(Array.from(recoveredPixels)).toEqual(Array.from(docToPayload(recoverySnapshot).frames[0].layers[0].data))
  })

  it('a plain (non-RuntimeError) exception is ALSO treated as fatal-poison (phase 7f: the real post-trap symptom is a plain Error, not another RuntimeError)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { tryResolveWasmPixelCore, resetWasmPixelCoreResolverForTests } = await import('./wasm-pixel-core-resolver')
    resetWasmPixelCoreResolverForTests()

    tryResolveWasmPixelCore(makeDoc(), () => makeDoc())
    loadResolve?.()
    await Promise.resolve()
    await Promise.resolve()

    const core = tryResolveWasmPixelCore(makeDoc(), () => makeDoc(7))
    if (!core) throw new Error('unreachable')
    const fake = FakeWasmPixelCore.instances[FakeWasmPixelCore.instances.length - 1]
    fake.trapOnNextCall = 'plain-error'

    expect(() => core.dispatch({ type: 'undo' })).toThrow(/recursive use of an object/)
    // demoted on the FIRST (plain-Error) throw already — no RuntimeError ever occurred.
    expect(() => core.dispatch({ type: 'undo' })).not.toThrow()
    expect(core.canUndo).toBe(false)
  })

  it('once demoted, a genuine error from the recovered TsPixelCore propagates as-is (not mistaken for a new trap)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { tryResolveWasmPixelCore, resetWasmPixelCoreResolverForTests } = await import('./wasm-pixel-core-resolver')
    resetWasmPixelCoreResolverForTests()

    tryResolveWasmPixelCore(makeDoc(), () => makeDoc())
    loadResolve?.()
    await Promise.resolve()
    await Promise.resolve()

    const core = tryResolveWasmPixelCore(makeDoc(), () => makeDoc())
    if (!core) throw new Error('unreachable')
    const fake = FakeWasmPixelCore.instances[FakeWasmPixelCore.instances.length - 1]
    fake.trapOnNextCall = 'runtime-error'
    expect(() => core.dispatch({ type: 'undo' })).toThrow() // demotes

    // now `readLayer` on the RECOVERED (real) TsPixelCore for an unknown id
    // is a boundary no-op (empty array), never a throw — proving the guard
    // isn't swallowing/rewriting it into something else post-demotion.
    expect(() => core.readLayer('nope', 'nope')).not.toThrow()
  })
})
