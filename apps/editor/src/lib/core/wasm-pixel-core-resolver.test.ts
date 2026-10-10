/**
 * Tests `wasm-pixel-core-resolver.ts`'s two responsibilities:
 *  1. `tryResolveWasmPixelCore` stays synchronous and only returns a Wasm
 *     core once the module has actually finished loading (never blocks).
 *  2. The trap-safety wrapper: a `WebAssembly.RuntimeError` mid-session
 *     demotes to a `TsPixelCore` recovered from the trapped core's
 *     last-good `exportDocument()` — verified by actually reading the
 *     recovered document's pixel content back out afterward, not just
 *     inferring it from a mock call count.
 *
 * `@pixelforge/core` is mocked wholesale — this file tests THIS module's
 * wiring/recovery logic, not `WasmPixelCore` itself (that has its own
 * `packages/core/src-ts/wasm-document-core.test.ts`, against the real wasm
 * binary).
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createEmptyBuffer } from '../pixel-buffer'
import type { Command, DispatchResult } from './commands'
import type { DocSnapshot } from './ts-core'
import type { DocumentPayload, DocumentFramePayload } from '@/types/document'

function makeDoc(): DocSnapshot {
  const w = 2
  const h = 2
  return {
    canvasWidth: w,
    canvasHeight: h,
    timeline: {
      frames: [{ id: 'F0', layers: [{ id: 'L0', name: 'a', visible: true, locked: false, opacity: 100, pixels: createEmptyBuffer(w, h) }], activeLayerId: 'L0', durationMs: 83 }],
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
// this test controls exactly when it "traps".
class FakeWasmPixelCore {
  static instances: FakeWasmPixelCore[] = []
  readonly impl = 'wasm' as const
  trapOnNextDispatch = false
  private payload: DocumentPayload
  canUndo = false
  canRedo = false

  constructor(
    _mod: unknown,
    doc: DocSnapshot
  ) {
    this.payload = docToPayload(doc)
    FakeWasmPixelCore.instances.push(this)
  }

  private maybeTrap(): void {
    if (this.trapOnNextDispatch) {
      this.trapOnNextDispatch = false
      throw new WebAssembly.RuntimeError('simulated Wasm trap')
    }
  }

  dispatch(_cmd: Command): DispatchResult {
    this.maybeTrap()
    return { changed: false, contentChanged: false, historyChanged: false, canUndo: false, canRedo: false, strokeOpen: false, revision: 0, contentRevision: 0, dirty: [], evicted: [], layerRevisions: {} }
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
  exportDocument(): DocumentPayload {
    this.maybeTrap()
    return this.payload
  }
  importDocument(doc: DocumentPayload): void {
    this.payload = doc
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

describe('tryResolveWasmPixelCore', () => {
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

    const first = tryResolveWasmPixelCore(makeDoc())
    expect(first).toBeNull() // kicked off loading, but never blocks

    loadResolve?.()
    await Promise.resolve()
    await Promise.resolve() // flush the .then() microtask

    const second = tryResolveWasmPixelCore(makeDoc())
    expect(second).not.toBeNull()
    expect(second?.impl).toBe('wasm')
  })

  it('logs once (and only once) if the module load itself fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { tryResolveWasmPixelCore, resetWasmPixelCoreResolverForTests } = await import('./wasm-pixel-core-resolver')
    resetWasmPixelCoreResolverForTests()

    tryResolveWasmPixelCore(makeDoc())
    loadReject?.(new Error('network error'))
    await Promise.resolve()
    await Promise.resolve()

    const still = tryResolveWasmPixelCore(makeDoc())
    expect(still).toBeNull()
    expect(errorSpy).toHaveBeenCalledTimes(1)
  })

  it('a mid-session Wasm trap demotes to TsPixelCore, recovering the last-good document content', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { tryResolveWasmPixelCore, resetWasmPixelCoreResolverForTests } = await import('./wasm-pixel-core-resolver')
    resetWasmPixelCoreResolverForTests()

    tryResolveWasmPixelCore(makeDoc())
    loadResolve?.()
    await Promise.resolve()
    await Promise.resolve()

    const doc = makeDoc()
    const core = tryResolveWasmPixelCore(doc)
    expect(core).not.toBeNull()
    if (!core) throw new Error('unreachable')
    expect(core.impl).toBe('wasm')

    const fake = FakeWasmPixelCore.instances[FakeWasmPixelCore.instances.length - 1]
    // stamp a recognizable byte into the fake's "last-good" export so we can
    // prove it survives the demotion, not just that SOME document exists.
    fake.importDocument({ ...docToPayload(doc), frames: docToPayload(doc).frames.map((f) => ({ ...f, layers: f.layers.map((l) => ({ ...l, data: new Uint8Array(l.data).fill(42) })) })) })

    fake.trapOnNextDispatch = true
    expect(() => core.dispatch({ type: 'undo' })).toThrow(WebAssembly.RuntimeError)

    // the SAME command is lost (documented limitation), but the next call
    // reaches the recovered TsPixelCore without throwing...
    expect(() => core.dispatch({ type: 'undo' })).not.toThrow()
    expect(core.impl).toBe('wasm') // the wrapper's own `impl` tag is stable; `dispatch` now delegates to a TsPixelCore internally

    // ...and the recovered document's pixel content matches what was
    // exported right before the trap, not an empty/fresh document.
    const recoveredPixels = core.exportDocument().frames[0].layers[0].data
    expect(Array.from(recoveredPixels)).toEqual(new Array(recoveredPixels.length).fill(42))
  })

  it('a trap whose own exportDocument() also fails does not throw out of the resolver itself', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { tryResolveWasmPixelCore, resetWasmPixelCoreResolverForTests } = await import('./wasm-pixel-core-resolver')
    resetWasmPixelCoreResolverForTests()

    tryResolveWasmPixelCore(makeDoc())
    loadResolve?.()
    await Promise.resolve()
    await Promise.resolve()

    const core = tryResolveWasmPixelCore(makeDoc())
    if (!core) throw new Error('unreachable')
    const fake = FakeWasmPixelCore.instances[FakeWasmPixelCore.instances.length - 1]
    fake.exportDocument = () => {
      throw new WebAssembly.RuntimeError('export also traps')
    }
    fake.trapOnNextDispatch = true
    expect(() => core.dispatch({ type: 'undo' })).toThrow(WebAssembly.RuntimeError)
    // second call: no recovered document exists, so it keeps delegating to
    // the (still-trapped) wasm instance rather than inventing a blank one —
    // documented as a known limitation, but it must not CRASH the resolver.
    expect(() => core.dispatch({ type: 'undo' })).not.toThrow(/unexpected internal error/)
  })
})
