import type { AnimationFrame, Layer, Timeline } from '@/types'
import type { DocumentPayload } from '@/types/document'
import type { Command, DispatchResult } from './commands'
import {
  createCoreState,
  dispatchCommand,
  docToPayload,
  payloadToDoc,
  readLayer as readLayerFromState,
  type CoreState,
  type DocSnapshot,
} from './ts-core'

/** Layer metadata only — everything {@link Layer} has except `pixels`. */
export type LayerMeta = Omit<Layer, 'pixels'>

/** Frame metadata only — everything {@link AnimationFrame} has except each layer's pixels. */
export interface FrameMeta extends Omit<AnimationFrame, 'layers'> {
  readonly layers: ReadonlyArray<LayerMeta>
}

/**
 * `PixelCore.snapshot()`'s return shape (Wasm-boundary blocker B3, closed —
 * see design.md's "Pixel cache contract"): metadata only — ids, names,
 * opacity, visibility, durations, playback/view state — NEVER pixel data.
 * Pixels cross the boundary exclusively through `readLayer`. Structurally
 * identical to {@link DocSnapshot}'s `timeline`, with every layer's `pixels`
 * field removed.
 */
export interface DocMetaSnapshot {
  readonly canvasWidth: number
  readonly canvasHeight: number
  readonly timeline: Omit<Timeline, 'frames'> & { readonly frames: ReadonlyArray<FrameMeta> }
}

/** Strips `pixels` off a live `Layer` — the only thing {@link DocMetaSnapshot} ever drops. */
function toLayerMeta(layer: Layer): LayerMeta {
  const { pixels: _pixels, ...meta } = layer
  return meta
}

/** Converts the core's internal, pixel-carrying {@link DocSnapshot} into the metadata-only shape `PixelCore.snapshot()` exposes. */
export function toMetaSnapshot(doc: DocSnapshot): DocMetaSnapshot {
  return {
    canvasWidth: doc.canvasWidth,
    canvasHeight: doc.canvasHeight,
    timeline: {
      ...doc.timeline,
      frames: doc.timeline.frames.map((f) => ({ ...f, layers: f.layers.map(toLayerMeta) })),
    },
  }
}

/**
 * `PixelCore` (phase 2e/2f/4, design.md "Interfaces / Contracts"): the stable
 * boundary a future `WasmCore` (phase 5+) must satisfy identically to
 * `TsPixelCore` below. Every method here already matches the shape a
 * wasm-bindgen facade would expose — numeric/string handles and plain data
 * in, plain data (or a transient view) out, never a live JS object crossing
 * in either direction except `dispatch`'s `Command` (itself plain data as of
 * phase 2e — see `commands.ts`).
 */
export interface PixelCore {
  readonly impl: 'ts' | 'wasm'
  dispatch(cmd: Command): DispatchResult
  undo(): DispatchResult
  redo(): DispatchResult
  /**
   * A VIEW into the layer's live pixels — valid only until the next
   * `dispatch` (design D7: a future Wasm core's buffers live in Wasm linear
   * memory, and a JS view over them is invalidated by the next call that
   * might grow that memory). Unknown ids are a boundary-validated no-op: an
   * empty `Uint8ClampedArray`, never a throw. Callers that need to KEEP the
   * data past the next dispatch must copy it out immediately (e.g.
   * `new Uint8ClampedArray(core.readLayer(f, l))`) — see `core.slice.ts`'s
   * pixel cache for the reference implementation of this contract.
   */
  readLayer(frameId: string, layerId: string): Uint8ClampedArray
  /**
   * Metadata only (Wasm-boundary blocker B3, closed) — ids, names, opacity,
   * visibility, durations, playback/view state. NEVER pixel data; read a
   * layer's pixels via {@link PixelCore.readLayer}.
   */
  snapshot(): DocMetaSnapshot
  exportDocument(): DocumentPayload
  importDocument(doc: DocumentPayload): void
  readonly canUndo: boolean
  readonly canRedo: boolean
}

/**
 * The TS implementation of {@link PixelCore} — a thin, stateful OOP wrapper
 * around the functional dispatch engine in `ts-core.ts` (the engine itself
 * stays functional/testable in isolation; this class exists so callers that
 * want "an object with a dispatch method" — the `pixel-core.contract.test.ts`
 * suite, and eventually a `WasmCore` sibling — have one consistent shape to
 * program against).
 *
 * This gap is CLOSED as of phase 2f (B1): `stores/slices/core.slice.ts`
 * holds a `PixelCore` instance (from `resolveCore()`, `core-config.ts`) and
 * calls ONLY this interface's methods — `dispatch`/`undo`/`redo`/
 * `exportDocument`/`importDocument`/`snapshot` — never the TS-internal
 * `dispatchCommand`/`createCoreState` functions directly. Swapping
 * `resolveCore()`'s implementation for a future `WasmPixelCore` needs no
 * change in `core.slice.ts`.
 */
export class TsPixelCore implements PixelCore {
  readonly impl = 'ts' as const
  private state: CoreState

  constructor(doc: DocSnapshot) {
    this.state = createCoreState(doc)
  }

  dispatch(cmd: Command): DispatchResult {
    const outcome = dispatchCommand(this.state, cmd)
    this.state = outcome.state
    return outcome.result
  }

  undo(): DispatchResult {
    return this.dispatch({ type: 'undo' })
  }

  redo(): DispatchResult {
    return this.dispatch({ type: 'redo' })
  }

  readLayer(frameId: string, layerId: string): Uint8ClampedArray {
    return readLayerFromState(this.state, frameId, layerId)
  }

  snapshot(): DocMetaSnapshot {
    return toMetaSnapshot(this.state.doc)
  }

  exportDocument(): DocumentPayload {
    return docToPayload(this.state.doc)
  }

  importDocument(doc: DocumentPayload): void {
    this.state = createCoreState(payloadToDoc(doc))
  }

  get canUndo(): boolean {
    return this.state.history.cursor >= 0
  }

  get canRedo(): boolean {
    return this.state.history.cursor < this.state.history.entries.length - 1
  }
}
