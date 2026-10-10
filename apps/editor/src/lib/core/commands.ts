import type { PixelBuffer, Rect } from '@/types'

/**
 * Command-dispatch seam (phase 2, design D3/D5). Every canvas mutation —
 * undoable or not — routes through `dispatch(cmd)` instead of a direct store
 * setter. This is the single entry point the edit-history spec's
 * "Command-Based Mutation" requirement calls for, AND (phase 2b, design D3)
 * the core-boundary requirement that the UI mutate pixels/frames only
 * through `dispatch`, never a parallel copy in Zustand.
 *
 * Phase 2c (judgment-day fixes, design D3 revision — "patch-based undo is
 * only sound if EVERY document mutation goes through history"): the
 * undoable/non-undoable split below REPLACES the phase-2b split. Every
 * command that mutates the DOCUMENT (pixels, layers, frames) is now
 * undoable. Only commands that mutate VIEW/PLAYBACK state (which frame/tool
 * is selected, fps, loop, isPlaying) stay non-undoable — undoing a document
 * edit must never revert "what the user was looking at".
 *
 * Phase 2e (Wasm readiness of the core boundary — design D6/D1): every
 * command payload below is now serializable plain data — numbers, typed
 * arrays, plain objects — never a live `Layer`/`AnimationFrame` object or a
 * shared buffer reference a Rust/wasm-bindgen core could not accept as-is.
 * Colors cross as a packed `rgba: number` (`color-codec.ts`), batched points
 * as an interleaved `Int32Array` (`stroke.points`), pasted frames as
 * `SerializedFrame[]` (`frame.paste`), and a committed selection as a rect
 * plus its own `Uint8ClampedArray` patch (`selection.commit`) instead of a
 * whole-canvas buffer. The core COPIES every buffer it receives — it never
 * keeps a reference into the caller's memory (see `ts-core.ts`'s
 * `doc.replace`/`frame.paste`/`selection.commit` cases).
 *
 * Two families of commands:
 *  - UNDOABLE (push a history entry): `stroke.*`, `fill`, `frame.add`,
 *    `frame.remove`, `frame.paste`, `doc.replace`, `layer.add`,
 *    `layer.remove`, `layer.meta`, `layer.reorder`, `selection.commit`,
 *    `region.clear`, `undo`, `redo`.
 *  - NON-UNDOABLE (mutate view/playback state, bump `revision`, but push NO
 *    history entry): `layer.setActive` (which layer is selected — a
 *    selection, not a document edit), `frame.select` (navigation),
 *    `timeline.setFps`, `timeline.toggleLoop`, `timeline.setFrameSelection`,
 *    `timeline.togglePlayback` (playback/view prefs — see design.md's
 *    "Command Undoability" note, the authoritative list this comment must
 *    stay in sync with).
 */

export type LayerId = string
export type FrameId = string

/**
 * Plain, structured-clone-safe layer data (phase 2e) — a `frame.paste`
 * command carries these instead of live `Layer` objects. `id` is OPTIONAL and
 * purely informational: the core ALWAYS assigns a fresh id on paste
 * (judgment-day round 2, finding 6 — never aliases an id or a buffer with
 * whatever is still sitting in the clipboard), so a caller-supplied id is
 * never trusted, only logged/inspected if useful.
 */
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

/** Plain, structured-clone-safe frame data — see {@link SerializedLayer}. */
export interface SerializedFrame {
  readonly id?: FrameId
  readonly activeLayerId?: LayerId
  readonly durationMs: number
  readonly layers: ReadonlyArray<SerializedLayer>
}

export interface DocReplaceFrameInput {
  readonly pixels: PixelBuffer
}

/** Partial update to a layer's metadata (name/visibility/lock/opacity). Pixels are never patched through `layer.meta` — use `region.clear`/`selection.commit`/strokes for that. */
export interface LayerMetaPatch {
  readonly name?: string
  readonly visible?: boolean
  readonly locked?: boolean
  readonly opacity?: number
}

export type Command =
  | { readonly type: 'stroke.begin'; readonly layerId: LayerId }
  | {
      /**
       * No `layerId` (phase 2e: dropped as redundant) — a `stroke.points`
       * batch always targets the layer the open stroke is already bound to
       * (`stroke.begin`'s `layerId`); carrying it again on every batch was a
       * payload a Rust core would have to validate twice for nothing.
       */
      readonly type: 'stroke.points'
      /** Interleaved `x,y` pairs — see `color-codec.ts`'s `packPoints`. */
      readonly points: Int32Array
      /** Packed RGBA — see `color-codec.ts`'s `packRgba`/`unpackRgba`. */
      readonly rgba: number
    }
  | { readonly type: 'stroke.end'; readonly label: string }
  | {
      readonly type: 'fill'
      readonly layerId: LayerId
      readonly x: number
      readonly y: number
      /** Packed RGBA — see `color-codec.ts`. */
      readonly rgba: number
      readonly label?: string
    }
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
  | { readonly type: 'undo' }
  | { readonly type: 'redo' }
  // ── Undoable: layer CRUD (phase 2c — every document mutation is undoable) ─
  | { readonly type: 'layer.add' }
  | { readonly type: 'layer.remove'; readonly layerId: LayerId }
  | { readonly type: 'layer.meta'; readonly layerId: LayerId; readonly patch: LayerMetaPatch }
  | { readonly type: 'layer.reorder'; readonly from: number; readonly to: number }
  // ── Non-undoable: view state (which layer/frame is selected) ────────────
  | { readonly type: 'layer.setActive'; readonly layerId: LayerId }
  | { readonly type: 'frame.select'; readonly index: number }
  // ── Undoable: frame CRUD / clipboard paste ──────────────────────────────
  | { readonly type: 'frame.paste'; readonly at: number; readonly frames: ReadonlyArray<SerializedFrame> }
  // ── Undoable: selection/clipboard pixel ops ─────────────────────────────
  | {
      readonly type: 'selection.commit'
      readonly layerId: LayerId
      /** The rect this commit writes — the core never receives a whole-canvas buffer for a (usually much smaller) selection. */
      readonly at: Rect
      /** Exactly `at.w * at.h * 4` bytes, row-major RGBA — the patch, not the whole layer. */
      readonly pixels: Uint8ClampedArray
    }
  | { readonly type: 'region.clear'; readonly layerId: LayerId; readonly rect: Rect }
  // ── Non-undoable: playback/view prefs (never reverted by document undo) ─
  | { readonly type: 'timeline.setFps'; readonly fps: number }
  | { readonly type: 'timeline.toggleLoop' }
  | { readonly type: 'timeline.setFrameSelection'; readonly indices: ReadonlyArray<number> }
  | { readonly type: 'timeline.togglePlayback' }

/** A (frame, layer) pair — identifies exactly where a layer's pixels live, never just a bare layer id (see `DirtyRect`'s module doc: a layer id alone is ambiguous once more than one frame exists). */
export interface LayerRef {
  readonly frameId: FrameId
  readonly layerId: LayerId
}

/**
 * C1 fix (phase 4f): a dirty rect now carries its OWN `frameId`, not just a
 * `layerId` — the pixel cache (`stores/slices/core.slice.ts`) used to assume
 * "the dirty layer belongs to whatever frame is CURRENT after this dispatch
 * finishes", which is wrong exactly when a command both (a) force-commits an
 * open stroke bound to the OLD current frame and (b) moves "current" to a
 * DIFFERENT frame in the same dispatch (e.g. `frame.add` while a stroke is
 * open: the stroke's dirty layer lives in the frame that was current BEFORE
 * the add, not the brand-new frame that is current after it). Every
 * dirty-producing code path in `ts-core.ts` now tags the frame the pixels
 * actually live in.
 */
export interface DirtyRect extends LayerRef {
  readonly rect: Rect
}

/**
 * Explicit dispatch result (phase 2e). Every field the store slice (or any
 * future consumer) needs to react to a dispatch is computed HERE, by the
 * core, instead of the caller re-deriving it by comparing `CoreState`
 * references (e.g. `core.history !== prev.history`) — a Wasm core has no
 * JS object identity to compare in the first place.
 */
export interface DispatchResult {
  /** Whether this dispatch changed ANYTHING render-worthy (vs. a true no-op, e.g. undo with an empty stack). */
  readonly changed: boolean
  /** Whether the document's PERSISTED CONTENT changed — the autosave trigger. False for view/playback-only commands. */
  readonly contentChanged: boolean
  /** Whether the undo/redo stack changed (a new entry pushed, or cursor moved by undo/redo). */
  readonly historyChanged: boolean
  /**
   * Fix-agent 7g (store-loop performance): whether the document's SHAPE/
   * metadata — the frame/layer LIST, names, order, visibility/locked/opacity,
   * canvas size, current frame, active layer, or any `timeline.*` setting —
   * could possibly have changed. `false` for every pixel-only command
   * (`stroke.*`/`fill`/`region.clear`/`selection.commit`): those only ever
   * mutate the BYTES of layers already named in `dirty`, never the shape
   * `PixelCore.snapshot()` describes. Consumers (`core.slice.ts`) use this to
   * skip the `snapshot()` round-trip entirely on the hot path (a drawing
   * gesture fires many `stroke.points` dispatches per second) and patch
   * `dirty` layers' pixel data into their own already-held copy of the
   * timeline instead — see `core.slice.ts`'s `dispatch` for the mechanism and
   * `baseline-bench.md`'s "Phase 7g" section for the measured win.
   */
  readonly structureChanged: boolean
  readonly canUndo: boolean
  readonly canRedo: boolean
  /** Whether a stroke is open AFTER this dispatch — mirrors `CoreState.strokeState !== null`. */
  readonly strokeOpen: boolean
  /** Render-purpose monotonic counter (bumps on every dispatch that changes anything). */
  readonly revision: number
  /** Autosave-purpose monotonic counter (bumps only when document content changed). */
  readonly contentRevision: number
  readonly dirty: ReadonlyArray<DirtyRect>
  /**
   * C1 fix (phase 4f): the exact (frame, layer) pairs whose pixel cache entry
   * must be dropped — a layer or frame that was just REMOVED (forward
   * `frame.remove`/`layer.remove`, or an undo/redo that un-does an add/paste).
   * The pixel cache is keyed globally by layer id (never by frame), so a
   * removed id must be evicted explicitly instead of lingering forever.
   */
  readonly evicted: ReadonlyArray<LayerRef>
  /**
   * Phase 2f (Wasm-boundary blocker B2): the render contract — which layers
   * are dirty and by how much — crosses the `PixelCore` boundary as part of
   * THIS result, not by the caller reading `CoreState.layerRevisions`
   * directly (TS-internal state a Wasm core has no equivalent object for).
   * The FULL current map, not just this dispatch's delta, so a caller can
   * replace its own copy outright.
   */
  readonly layerRevisions: Readonly<Record<LayerId, number>>
}
