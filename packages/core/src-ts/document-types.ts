/**
 * Phase 7: the `PixelCore` boundary surface, re-declared HERE (structurally
 * identical to `apps/editor/src/lib/core/commands.ts`/`pixel-core.ts` — see
 * those files for the full design rationale behind every field/command
 * below, this file does not repeat it).
 *
 * KNOWN DEVIATION (documented, not hidden — see `tasks.md`'s 7.14 follow-up
 * task): `Command`/`DispatchResult`/`PixelCore`/`DocSnapshot`/
 * `DocumentPayload` canonically live in `apps/editor`, not here. The
 * established precedent for a TRULY shared boundary type is `PixelKernels`
 * (`./types.ts`) — `apps/editor` imports THAT one from `@pixelforge/core`.
 * Hoisting `Command`/`DispatchResult`/`PixelCore` the same way would mean
 * editing `apps/editor`'s `commands.ts`/`pixel-core.ts` (judgment-day-tested,
 * many consumers) to re-export from `@pixelforge/core` instead of declaring
 * locally — out of scope for this phase's time/risk budget. Instead, this
 * file declares a STRUCTURALLY IDENTICAL copy; TypeScript's structural typing
 * makes a `WasmPixelCore` (built against these local types) assignable to
 * apps/editor's own `PixelCore` type with zero adapter code, exactly the way
 * `resolveCore()` uses it. The risk this accepts: if `apps/editor`'s
 * `commands.ts`/`pixel-core.ts` shapes change later, this file must be
 * updated to match by hand — flagged here as a follow-up worth hoisting for
 * real once phase 7 is fully wired and the default flips to `wasm`.
 */

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface PixelBuffer {
  readonly w: number
  readonly h: number
  readonly data: Uint8ClampedArray
}

export interface Layer {
  readonly id: string
  readonly name: string
  readonly visible: boolean
  readonly locked: boolean
  readonly opacity: number
  readonly pixels: PixelBuffer
}

export interface AnimationFrame {
  readonly id: string
  readonly layers: Layer[]
  readonly activeLayerId: string
  readonly durationMs: number
}

export interface Timeline {
  readonly frames: AnimationFrame[]
  readonly currentFrameIndex: number
  readonly isPlaying: boolean
  readonly fps: number
  readonly loop: boolean
  readonly selectedFrameIndices: number[]
}

export interface DocSnapshot {
  readonly canvasWidth: number
  readonly canvasHeight: number
  readonly timeline: Timeline
}

export interface DocumentLayerPayload {
  readonly id: string
  readonly name: string
  readonly visible: boolean
  readonly locked: boolean
  readonly opacity: number
  readonly data: Uint8Array
}

export interface DocumentFramePayload {
  readonly id: string
  readonly activeLayerId: string
  readonly layers: DocumentLayerPayload[]
}

export interface DocumentPayload {
  readonly schemaVersion: number
  readonly w: number
  readonly h: number
  readonly frameMs: number[]
  readonly frames: DocumentFramePayload[]
}

export type LayerId = string
export type FrameId = string

export interface SerializedLayer {
  readonly id?: LayerId
  readonly name: string
  readonly visible: boolean
  readonly locked: boolean
  readonly opacity: number
  readonly w: number
  readonly h: number
  readonly data: Uint8Array
}

export interface SerializedFrame {
  readonly id?: FrameId
  readonly activeLayerId?: LayerId
  readonly durationMs: number
  readonly layers: ReadonlyArray<SerializedLayer>
}

export interface DocReplaceFrameInput {
  readonly pixels: PixelBuffer
}

export interface LayerMetaPatch {
  readonly name?: string
  readonly visible?: boolean
  readonly locked?: boolean
  readonly opacity?: number
}

export type Command =
  | { readonly type: 'stroke.begin'; readonly layerId: LayerId }
  | { readonly type: 'stroke.points'; readonly points: Int32Array; readonly rgba: number }
  | { readonly type: 'stroke.end'; readonly label: string }
  | { readonly type: 'fill'; readonly layerId: LayerId; readonly x: number; readonly y: number; readonly rgba: number; readonly label?: string }
  | { readonly type: 'frame.add' }
  | { readonly type: 'frame.remove'; readonly index: number }
  | {
      readonly type: 'doc.replace'
      readonly canvasWidth: number
      readonly canvasHeight: number
      readonly frames: ReadonlyArray<DocReplaceFrameInput>
      readonly frameDurationMs: number
      readonly label: string
    }
  | { readonly type: 'doc.resize'; readonly canvasWidth: number; readonly canvasHeight: number; readonly label: string }
  | { readonly type: 'undo' }
  | { readonly type: 'redo' }
  | { readonly type: 'layer.add' }
  | { readonly type: 'layer.remove'; readonly layerId: LayerId }
  | { readonly type: 'layer.meta'; readonly layerId: LayerId; readonly patch: LayerMetaPatch }
  | { readonly type: 'layer.reorder'; readonly from: number; readonly to: number }
  | { readonly type: 'layer.setActive'; readonly layerId: LayerId }
  | { readonly type: 'frame.select'; readonly index: number }
  | { readonly type: 'frame.paste'; readonly at: number; readonly frames: ReadonlyArray<SerializedFrame> }
  | { readonly type: 'selection.commit'; readonly layerId: LayerId; readonly at: Rect; readonly pixels: Uint8ClampedArray }
  | { readonly type: 'region.clear'; readonly layerId: LayerId; readonly rect: Rect }
  | { readonly type: 'timeline.setFps'; readonly fps: number }
  | { readonly type: 'timeline.toggleLoop' }
  | { readonly type: 'timeline.setFrameSelection'; readonly indices: ReadonlyArray<number> }
  | { readonly type: 'timeline.togglePlayback' }

export interface LayerRef {
  readonly frameId: FrameId
  readonly layerId: LayerId
}

export interface DirtyRect extends LayerRef {
  readonly rect: Rect
}

export interface DispatchResult {
  readonly changed: boolean
  readonly contentChanged: boolean
  readonly historyChanged: boolean
  /** Fix-agent 7g (store-loop performance): see `apps/editor/src/lib/core/commands.ts`'s `DispatchResult.structureChanged` doc — same field, same meaning. */
  readonly structureChanged: boolean
  readonly canUndo: boolean
  readonly canRedo: boolean
  readonly strokeOpen: boolean
  readonly revision: number
  readonly contentRevision: number
  readonly dirty: ReadonlyArray<DirtyRect>
  readonly evicted: ReadonlyArray<LayerRef>
  readonly layerRevisions: Readonly<Record<LayerId, number>>
}

export type LayerMeta = Omit<Layer, 'pixels'>

export interface FrameMeta extends Omit<AnimationFrame, 'layers'> {
  readonly layers: ReadonlyArray<LayerMeta>
}

export interface DocMetaSnapshot {
  readonly canvasWidth: number
  readonly canvasHeight: number
  readonly timeline: Omit<Timeline, 'frames'> & { readonly frames: ReadonlyArray<FrameMeta> }
}

export interface PixelCore {
  readonly impl: 'ts' | 'wasm'
  dispatch(cmd: Command): DispatchResult
  undo(): DispatchResult
  redo(): DispatchResult
  readLayer(frameId: string, layerId: string): Uint8ClampedArray
  snapshot(): DocMetaSnapshot
  exportDocument(): DocumentPayload
  importDocument(doc: DocumentPayload): void
  readonly canUndo: boolean
  readonly canRedo: boolean
}
