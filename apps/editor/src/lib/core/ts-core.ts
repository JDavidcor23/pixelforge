import type { AnimationFrame, Layer, PixelBuffer, Rect, Timeline } from '@/types'
import type { DocumentFramePayload, DocumentLayerPayload, DocumentPayload } from '@/types/document'
import { MS_PER_SECOND, SPRITE_EDITOR_CANVAS, SPRITE_EDITOR_DEFAULTS, SPRITE_EDITOR_LAYER, SPRITE_EDITOR_TIMELINE } from '@/constants'
import { DOCUMENT_SCHEMA_VERSION } from '@/constants/persistence'
import {
  bytesEqual,
  cloneBuffer,
  createEmptyBuffer,
  diffRect,
  extractRect,
  isInBounds,
  putPixel,
  writeRect,
} from '../pixel-buffer'
import { cloneFrames } from '../history'
import { unpackRgba } from './color-codec'
import { getActiveKernels } from './kernels'
import type { Command, DirtyRect, DispatchResult, LayerMetaPatch, LayerRef, SerializedFrame } from './commands'
import {
  canRedo as historyCanRedo,
  canUndo as historyCanUndo,
  createHistory,
  popRedo,
  popUndo,
  pushEntry,
  type History,
  type HistoryEntry,
  type LayerMetaSnapshot,
  type StructuralDocSnapshot,
} from './history'

/**
 * The TS implementation of the `PixelCore` seam (design D3/D5). Pragmatic
 * phase-2 scope: operates on the SAME `Layer[]`/`AnimationFrame[]`/
 * `Timeline` shapes the store already uses (not a wholly separate internal
 * representation) — the real "core owns storage independently of the UI"
 * boundary design.md describes is deferred to the phase 3 monorepo split,
 * where `packages/core` genuinely becomes a separate package. For phase 2,
 * `DocSnapshot` below IS what `core.snapshot()`/`readLayer()` would expose.
 *
 * Phase 2b (design D3, deviation fix): `DocSnapshot` no longer carries a
 * top-level `layers`/`activeLayerId` copy of "the current frame" alongside
 * `timeline.frames[currentFrameIndex]`. `timeline.frames[i].layers` is now
 * the ONLY copy — `currentLayers`/`currentActiveLayerId` below are plain
 * reads of it, never a second mutable buffer.
 */
/** Bytes per pixel (RGBA) — matches `lib/pixel-buffer.ts`'s private `CHANNELS` byte-for-byte; used here only for boundary byte-length validation (W5). */
const CHANNELS = 4

export interface DocSnapshot {
  readonly canvasWidth: number
  readonly canvasHeight: number
  readonly timeline: Timeline
}

export function currentFrame(doc: DocSnapshot): AnimationFrame {
  return doc.timeline.frames[doc.timeline.currentFrameIndex]
}

export function currentLayers(doc: DocSnapshot): Layer[] {
  return currentFrame(doc).layers
}

export function currentActiveLayerId(doc: DocSnapshot): string {
  return currentFrame(doc).activeLayerId
}

/** Immutably replaces one frame's `layers`/`activeLayerId` (whichever is given) in `doc.timeline.frames`. */
function withFrame(
  doc: DocSnapshot,
  index: number,
  patch: Partial<Pick<AnimationFrame, 'layers' | 'activeLayerId'>>
): DocSnapshot {
  const frames = doc.timeline.frames.map((f, i) => (i === index ? { ...f, ...patch } : f))
  return { ...doc, timeline: { ...doc.timeline, frames } }
}

function withCurrentFrame(doc: DocSnapshot, patch: Partial<Pick<AnimationFrame, 'layers' | 'activeLayerId'>>): DocSnapshot {
  return withFrame(doc, doc.timeline.currentFrameIndex, patch)
}

export interface StrokeState {
  readonly layerId: string
  /** Stable id of the frame the stroke began on — a stroke is bound to the frameId+layerId where it began. */
  readonly frameId: string
  /** Full copy of the layer's pixels taken at `stroke.begin`, before any point was written — diffed against `working` at `stroke.end` to produce the undo patch. Never mutated. */
  readonly shadow: PixelBuffer
  /** The SAME mutable buffer every `stroke.points` batch writes into in place — one clone at `stroke.begin`, zero clones per batch for the rest of the gesture. */
  readonly working: PixelBuffer
}

export interface CoreState {
  readonly doc: DocSnapshot
  readonly history: History
  readonly strokeState: StrokeState | null
  /** Render-purpose counter: bumped by EVERY dispatch that changes anything (content or view). */
  readonly revision: number
  /**
   * Autosave-purpose counter (judgment-day round 2, finding 5): bumped ONLY
   * when the DOCUMENT's persisted content actually changed — never for
   * view/playback-only commands (`layer.setActive`, `frame.select`,
   * `timeline.*`). This is what `useDocRevision`/autosave watch. Optional
   * for backward compatibility with hand-constructed `CoreState` literals in
   * tests that predate this field.
   */
  readonly contentRevision?: number
  /**
   * Per-layer dirty counter (judgment-day round 2, finding 1): the render
   * contract Konva's `SpriteLayers` must key its per-layer memoization on,
   * INSTEAD of pixel-buffer identity — a future Wasm core's buffers are
   * views, where identity is meaningless. Optional for the same
   * backward-compatibility reason as `contentRevision`.
   */
  readonly layerRevisions?: Readonly<Record<string, number>>
  /**
   * Phase 4 (Wasm-boundary blocker B4, closed): the core mints its OWN ids —
   * no JS callback crosses the boundary any more (a future Wasm core has no
   * way to call back into JS for an id). `idSeed` is captured once at
   * `createCoreState` time; `frameIdCounter`/`layerIdCounter` are mutated IN
   * PLACE (not replaced) on every mint, exactly like a monotonic nonce — this
   * is intentional: spreading `CoreState` (`withState`, `{...prev}`) copies
   * the REFERENCE to the same counter object, so the counter survives every
   * state transition (including undo/redo) without needing to be threaded
   * through as part of the immutable patch. Ids are never reused and never
   * need to roll back — undo restores already-minted entries verbatim, it
   * never re-mints.
   */
  readonly idSeed: string
  readonly frameIdCounter: IdCounter
  readonly layerIdCounter: IdCounter
}

/** A mutable nonce held by reference inside `CoreState` — see the field doc above. */
interface IdCounter {
  value: number
}

/**
 * Module-level override set by {@link setIdSeed} — consumed by exactly ONE
 * {@link createCoreState} call, then cleared (W4 fix). It used to stay sticky
 * forever (every subsequent `CoreState`, in this test file or any OTHER one
 * that runs later in the same process, silently inherited whatever the last
 * `setIdSeed` call left behind) — that is itself a bug source, not just a
 * footgun: a `createCoreState` call three function-calls deep inside
 * `importDocument` (unrelated to whatever test last called `setIdSeed`) would
 * silently reuse that stale seed. "Per core instance, explicit reset" means
 * exactly this: call `setIdSeed` again immediately before EVERY construction
 * that needs a specific deterministic prefix (every test that uses this
 * already does, see `pixel-core.contract.test.ts`) — there is no ambient
 * sticky default to accidentally inherit any more.
 */
let idSeedOverride: string | null = null

/**
 * Core-owned seedable ids (Wasm-boundary blocker B4, closed): sets the
 * prefix the VERY NEXT {@link createCoreState} call will use (consumed once,
 * see the field doc above), replacing the old JS `idGenerator` callback that
 * used to cross the `PixelCore` boundary. A future Rust/wasm-bindgen core
 * exposes the equivalent as a plain `set_id_seed(prefix: &str)` export — no
 * callback, no closure, just a string in.
 */
export function setIdSeed(prefix: string): void {
  idSeedOverride = prefix
}

/** A fresh random prefix — picked per `CoreState` by default (never reused), so re-importing the same payload twice in one page session can never collide with ids the payload already contains. */
function randomIdSeed(): string {
  return crypto.randomUUID().slice(0, 8)
}

/**
 * W4 fix: the highest numeric suffix already used by `${idSeed}-${kind}`
 * among `ids` — 0 if none. `createCoreState` seeds its counters from this
 * (not always 0) so a freshly-minted id can NEVER collide with an id already
 * present in the document it was constructed from — this is what closes the
 * real bug: a seeded core re-imports a payload that already contains ids
 * matching ITS OWN seed (e.g. two cores sharing one seed on purpose for a
 * parity test, or — far rarer but not impossible at 32 bits of entropy — an
 * unlucky random seed collision), and without this scan, both cores' fresh
 * counters would restart at 0 and immediately re-mint an id the payload
 * already uses.
 */
function highestIdSuffix(ids: readonly string[], idSeed: string, kind: 'f' | 'l'): number {
  const prefix = `${idSeed}-${kind}`
  let max = 0
  for (const id of ids) {
    if (!id.startsWith(prefix)) continue
    const n = Number(id.slice(prefix.length))
    if (Number.isInteger(n) && n > max) max = n
  }
  return max
}

export function createCoreState(doc: DocSnapshot): CoreState {
  const idSeed = idSeedOverride ?? randomIdSeed()
  idSeedOverride = null // consume-once: no sticky module global (W4)
  const frameIds = doc.timeline.frames.map((f) => f.id)
  const layerIds = doc.timeline.frames.flatMap((f) => f.layers.map((l) => l.id))
  return {
    doc,
    history: createHistory(),
    strokeState: null,
    revision: 0,
    contentRevision: 0,
    layerRevisions: {},
    idSeed,
    frameIdCounter: { value: highestIdSuffix(frameIds, idSeed, 'f') },
    layerIdCounter: { value: highestIdSuffix(layerIds, idSeed, 'l') },
  }
}

/** Mints a fresh, stable frame id: `${idSeed}-f${n}`. */
function nextFrameId(state: CoreState): string {
  state.frameIdCounter.value += 1
  return `${state.idSeed}-f${state.frameIdCounter.value}`
}

/** Mints a fresh, stable layer id: `${idSeed}-l${n}`. */
function nextLayerId(state: CoreState): string {
  state.layerIdCounter.value += 1
  return `${state.idSeed}-l${state.layerIdCounter.value}`
}

export interface DispatchOutcome {
  readonly state: CoreState
  readonly result: DispatchResult
}

/** Internal-only outcome shape `dispatchCommandSwitch` returns — the public, fully-computed {@link DispatchResult} is assembled once, by `dispatchCommand`'s wrapper (see module doc "Explicit DispatchResult"). */
interface SwitchOutcome {
  readonly state: CoreState
  readonly result: {
    readonly dirty: ReadonlyArray<DirtyRect>
    readonly changed: boolean
    /** (frame, layer) pairs to drop from the pixel cache — a layer/frame that just disappeared. Omitted/empty for every case that doesn't remove one. */
    readonly evicted?: ReadonlyArray<LayerRef>
  }
}

function noChange(state: CoreState): SwitchOutcome {
  return { state, result: { dirty: [], changed: false } }
}

/**
 * Phase 5: a zero-copy reinterpretation of a `Uint8ClampedArray` as a
 * `Uint8Array` — `PixelKernels` (both `tsKernels` and the Wasm kernels,
 * `@pixelforge/core`) operate on `Uint8Array` (that package's own domain
 * type, design D6/D1), while every pixel buffer in this app is a
 * `Uint8ClampedArray` (design D1). This is a VIEW over the SAME underlying
 * `ArrayBuffer`, not a copy — every byte the kernel writes through it is
 * immediately visible through the original `Uint8ClampedArray` (and vice
 * versa). Safe specifically because a flood fill only ever writes
 * already-clamped 0-255 byte values, so the two views' clamping behavior
 * never has a chance to diverge.
 */
function asKernelBuffer(data: Uint8ClampedArray): Uint8Array {
  return new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
}

/**
 * Builds the next `CoreState` by patching `prev` — the ONLY way any reducer
 * branch below should produce a new `CoreState`. Judgment-day round 3
 * (CRITICAL): six branches (`frame.add`, `frame.remove`, `doc.replace`,
 * `undo`, `redo`, `frame.paste`) used to construct a bare object literal
 * (`{ doc, history, strokeState, revision }`) instead of spreading `prev`,
 * which silently RESET `contentRevision`/`layerRevisions`/`idGenerator` on
 * every call — counters went backwards, autosave missed real content
 * changes, and deterministic test ids stopped being deterministic after the
 * very first frame op. Routing every branch through this helper makes that
 * class of bug structurally impossible: there is no second place left to
 * forget the spread.
 */
function withState(prev: CoreState, patch: Partial<CoreState>): CoreState {
  return { ...prev, ...patch }
}

/**
 * Intersects `rect` with the `[0,w) x [0,h)` canvas — `null` if the
 * intersection is empty (the rect doesn't overlap the canvas at all). Bug
 * #5: `region.clear` used to iterate the UNCLAMPED rect pixel-by-pixel,
 * allocating a `{x,y,color}` object per cell and relying on `isInBounds` to
 * discard most of them; clamping first means the write loop only ever
 * touches real, in-canvas pixels.
 */
function clampRectToBuffer(rect: Rect, w: number, h: number): Rect | null {
  const x0 = Math.max(0, rect.x)
  const y0 = Math.max(0, rect.y)
  const x1 = Math.min(w, rect.x + rect.w)
  const y1 = Math.min(h, rect.y + rect.h)
  if (x1 <= x0 || y1 <= y0) return null
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
}

function snapshotStructural(doc: DocSnapshot): StructuralDocSnapshot {
  return {
    canvasWidth: doc.canvasWidth,
    canvasHeight: doc.canvasHeight,
    timeline: { ...doc.timeline, frames: cloneFrames(doc.timeline.frames) },
  }
}

/** Every byte of `buf` as a `DirtyRect`'s rect — used when a whole layer (not just a patched sub-rect) needs re-reading into the pixel cache. */
function fullRect(buf: PixelBuffer): Rect {
  return { x: 0, y: 0, w: buf.w, h: buf.h }
}

/** One `DirtyRect` per layer in `frame`, each tagged with `frame.id` — a whole newly-(re)introduced frame needs every one of its layers read into the pixel cache. */
function fullDirty(frame: AnimationFrame): DirtyRect[] {
  return frame.layers.map((l) => ({ frameId: frame.id, layerId: l.id, rect: fullRect(l.pixels) }))
}

/** Same shape as {@link fullDirty}, without the (unused, for eviction) rect. */
function fullRefs(frame: AnimationFrame): LayerRef[] {
  return frame.layers.map((l) => ({ frameId: frame.id, layerId: l.id }))
}

/**
 * C1/W8 fix: computes the precise (frame, layer) pairs an undo/redo of `entry`
 * either re-populates (`dirty` — must be read back into the pixel cache) or
 * removes (`evicted` — must be dropped from it), instead of the old blanket
 * "re-read every layer of every frame" sweep. `direction` is the SAME
 * direction `applyEntry` is called with: `'before'` for undo, `'after'` for
 * redo. The rule is symmetric: whichever side of the entry the resulting
 * document now matches is `dirty`; whichever side it just left is `evicted`
 * (only when that side introduced/removed actual layers — `layer.meta`/
 * `layer.reorder` never touch pixels in either direction).
 */
function dirtyAndEvictedOf(
  entry: HistoryEntry,
  direction: 'before' | 'after'
): { readonly dirty: ReadonlyArray<DirtyRect>; readonly evicted: ReadonlyArray<LayerRef> } {
  const none = { dirty: [], evicted: [] } as const
  switch (entry.kind) {
    case 'patch':
      return { dirty: entry.patches.map((p) => ({ frameId: entry.frameId, layerId: p.layerId, rect: p.rect })), evicted: [] }
    case 'layer.meta':
    case 'layer.reorder':
      return none
    case 'layer.add': {
      const ref = { frameId: entry.frameId, layerId: entry.layer.id }
      const dirty = [{ ...ref, rect: fullRect(entry.layer.pixels) }]
      // 'after' = the layer exists (forward add); 'before' = it doesn't (undoing the add removes it).
      return direction === 'after' ? { dirty, evicted: [] } : { dirty: [], evicted: [ref] }
    }
    case 'layer.remove': {
      const ref = { frameId: entry.frameId, layerId: entry.layer.id }
      const dirty = [{ ...ref, rect: fullRect(entry.layer.pixels) }]
      // 'before' = the layer still exists (undoing the remove restores it); 'after' = removed again (redo).
      return direction === 'before' ? { dirty, evicted: [] } : { dirty: [], evicted: [ref] }
    }
    case 'frame.add':
      return direction === 'after' ? { dirty: fullDirty(entry.frame), evicted: [] } : { dirty: [], evicted: fullRefs(entry.frame) }
    case 'frame.remove':
      return direction === 'before' ? { dirty: fullDirty(entry.frame), evicted: [] } : { dirty: [], evicted: fullRefs(entry.frame) }
    case 'frame.paste':
      return direction === 'after'
        ? { dirty: entry.frames.flatMap(fullDirty), evicted: [] }
        : { dirty: [], evicted: entry.frames.flatMap(fullRefs) }
    case 'doc.replace': {
      const into = direction === 'before' ? entry.before : entry.after
      const outOf = direction === 'before' ? entry.after : entry.before
      return { dirty: into.timeline.frames.flatMap(fullDirty), evicted: outOf.timeline.frames.flatMap(fullRefs) }
    }
    default: {
      const _exhaustive: never = entry
      return none
    }
  }
}

function frameIndexById(doc: DocSnapshot, frameId: string): number {
  return doc.timeline.frames.findIndex((f) => f.id === frameId)
}

/**
 * Resolves the activeLayerId a frame should land on: prefers the id the
 * entry recorded, falls back to the frame's own current activeLayerId if
 * that still exists, and only as a last resort picks the first layer.
 * Guarantees `activeLayerId` NEVER points at a layer that no longer exists.
 */
function resolveActiveLayerId(layers: readonly Layer[], preferred: string, fallback: string): string {
  if (layers.some((l) => l.id === preferred)) return preferred
  if (layers.some((l) => l.id === fallback)) return fallback
  return layers[0]?.id ?? preferred
}

/**
 * Undo/redo FOCUS resolution (judgment-day round 2, finding 3 — design
 * decision, Aseprite-style): applying a history entry selects the
 * frame/layer the entry itself affected, if it still exists; otherwise it
 * keeps the CURRENT (pre-apply) selection if that is still valid; otherwise
 * it falls back to the nearest valid index. It NEVER restores an unrelated,
 * stale selection recorded at push time — that stale-snapshot behavior was
 * the judgment-day round 2 regression (`frame.select`/`layer.setActive`
 * navigation made AFTER an edit got silently reverted by undoing that
 * edit).
 */
function focusStructural(
  doc: DocSnapshot,
  frames: readonly AnimationFrame[],
  targetFrameId: string | undefined,
  targetLayerId: string | undefined,
  fallbackIndex: number
): { frames: AnimationFrame[]; currentFrameIndex: number } {
  const currentFrameId = doc.timeline.frames[doc.timeline.currentFrameIndex]?.id

  let frameIndex = targetFrameId ? frames.findIndex((f) => f.id === targetFrameId) : -1
  if (frameIndex === -1 && currentFrameId) frameIndex = frames.findIndex((f) => f.id === currentFrameId)
  if (frameIndex === -1) frameIndex = Math.max(0, Math.min(fallbackIndex, frames.length - 1))

  const frame = frames[frameIndex]
  if (!frame) return { frames: [...frames], currentFrameIndex: 0 }

  const activeLayerId = resolveActiveLayerId(frame.layers, targetLayerId ?? '', frame.activeLayerId)
  const patchedFrames = frames.map((f, i) => (i === frameIndex ? { ...f, activeLayerId } : f))
  return { frames: patchedFrames, currentFrameIndex: frameIndex }
}

function withFocus(
  doc: DocSnapshot,
  frames: readonly AnimationFrame[],
  targetFrameId: string | undefined,
  targetLayerId: string | undefined,
  fallbackIndex: number
): DocSnapshot {
  const focused = focusStructural(doc, frames, targetFrameId, targetLayerId, fallbackIndex)
  return {
    ...doc,
    timeline: {
      ...doc.timeline,
      frames: focused.frames,
      currentFrameIndex: focused.currentFrameIndex,
      selectedFrameIndices: [focused.currentFrameIndex],
    },
  }
}

/**
 * Applies a history entry's before/after data to `doc`, producing the
 * document state on the other side of undo (`direction: 'before'`) or redo
 * (`direction: 'after'`).
 *
 * A patch entry locates its frame by STABLE `frameId`, never by the index
 * it happened to be at when the entry was pushed. `doc.replace` restores
 * `frames`/`currentFrameIndex`/`selectedFrameIndices` from its snapshot but
 * deliberately KEEPS the CURRENT `fps`/`loop`/`isPlaying` instead of
 * reverting them — those are playback/view prefs, not document data. Every
 * other kind resolves its post-apply focus via `withFocus`/`focusStructural`
 * (judgment-day round 2, finding 3).
 */
function applyEntry(doc: DocSnapshot, entry: HistoryEntry, direction: 'before' | 'after'): DocSnapshot {
  switch (entry.kind) {
    case 'patch': {
      const frameIndex = frameIndexById(doc, entry.frameId)
      if (frameIndex === -1) return doc // the frame no longer exists — nothing to apply (defensive; should not happen now that removal is undoable)
      const frame = doc.timeline.frames[frameIndex]

      let layers = frame.layers
      for (const patch of entry.patches) {
        layers = layers.map((l) =>
          l.id === patch.layerId
            ? { ...l, pixels: writeRect(l.pixels, patch.rect, direction === 'before' ? patch.before : patch.after) }
            : l
        )
      }

      const activeLayerId = resolveActiveLayerId(layers, entry.activeLayerId, frame.activeLayerId)
      const frames = doc.timeline.frames.map((f, i) => (i === frameIndex ? { ...f, layers, activeLayerId } : f))

      return {
        ...doc,
        timeline: { ...doc.timeline, frames, currentFrameIndex: frameIndex, selectedFrameIndices: [frameIndex] },
      }
    }

    case 'doc.replace': {
      const snap = direction === 'before' ? entry.before : entry.after
      const frames = cloneFrames(snap.timeline.frames)
      const currentFrameIndex = Math.max(0, Math.min(snap.timeline.currentFrameIndex, frames.length - 1))
      const frame = frames[currentFrameIndex]
      const activeLayerId = frame ? resolveActiveLayerId(frame.layers, frame.activeLayerId, frame.activeLayerId) : undefined
      const patchedFrames = activeLayerId !== undefined
        ? frames.map((f, i) => (i === currentFrameIndex ? { ...f, activeLayerId } : f))
        : frames

      return {
        canvasWidth: snap.canvasWidth,
        canvasHeight: snap.canvasHeight,
        timeline: {
          ...doc.timeline,
          frames: patchedFrames,
          currentFrameIndex,
          selectedFrameIndices: snap.timeline.selectedFrameIndices,
        },
      }
    }

    case 'layer.add': {
      const frameIndex = frameIndexById(doc, entry.frameId)
      if (frameIndex === -1) return doc
      const frame = doc.timeline.frames[frameIndex]
      const layers =
        direction === 'after'
          ? [...frame.layers.slice(0, entry.index), entry.layer, ...frame.layers.slice(entry.index)]
          : frame.layers.filter((l) => l.id !== entry.layer.id)
      const frames = doc.timeline.frames.map((f, i) => (i === frameIndex ? { ...f, layers } : f))
      const targetLayerId = direction === 'after' ? entry.layer.id : undefined
      return withFocus(doc, frames, entry.frameId, targetLayerId, frameIndex)
    }

    case 'layer.remove': {
      const frameIndex = frameIndexById(doc, entry.frameId)
      if (frameIndex === -1) return doc
      const frame = doc.timeline.frames[frameIndex]
      const layers =
        direction === 'before'
          ? [...frame.layers.slice(0, entry.index), entry.layer, ...frame.layers.slice(entry.index)]
          : frame.layers.filter((l) => l.id !== entry.layer.id)
      const frames = doc.timeline.frames.map((f, i) => (i === frameIndex ? { ...f, layers } : f))
      const targetLayerId = direction === 'before' ? entry.layer.id : undefined
      return withFocus(doc, frames, entry.frameId, targetLayerId, frameIndex)
    }

    case 'layer.meta': {
      const frameIndex = frameIndexById(doc, entry.frameId)
      if (frameIndex === -1) return doc
      const frame = doc.timeline.frames[frameIndex]
      const patch: LayerMetaSnapshot = direction === 'before' ? entry.before : entry.after
      const layers = frame.layers.map((l) => (l.id === entry.layerId ? { ...l, ...patch } : l))
      const frames = doc.timeline.frames.map((f, i) => (i === frameIndex ? { ...f, layers } : f))
      return withFocus(doc, frames, entry.frameId, entry.layerId, frameIndex)
    }

    case 'layer.reorder': {
      const frameIndex = frameIndexById(doc, entry.frameId)
      if (frameIndex === -1) return doc
      const frame = doc.timeline.frames[frameIndex]
      const [from, to] = direction === 'after' ? [entry.from, entry.to] : [entry.to, entry.from]
      const layers = [...frame.layers]
      const [moved] = layers.splice(from, 1)
      layers.splice(to, 0, moved)
      const frames = doc.timeline.frames.map((f, i) => (i === frameIndex ? { ...f, layers } : f))
      return withFocus(doc, frames, entry.frameId, entry.layerId, frameIndex)
    }

    case 'frame.add': {
      if (direction === 'after') {
        const frames = [...doc.timeline.frames.slice(0, entry.index), entry.frame, ...doc.timeline.frames.slice(entry.index)]
        return withFocus(doc, frames, entry.frame.id, undefined, entry.index)
      }
      const frames = doc.timeline.frames.filter((f) => f.id !== entry.frame.id)
      return withFocus(doc, frames, undefined, undefined, entry.index)
    }

    case 'frame.remove': {
      if (direction === 'before') {
        const frames = [...doc.timeline.frames.slice(0, entry.index), entry.frame, ...doc.timeline.frames.slice(entry.index)]
        return withFocus(doc, frames, entry.frame.id, undefined, entry.index)
      }
      const frames = doc.timeline.frames.filter((f) => f.id !== entry.frame.id)
      return withFocus(doc, frames, undefined, undefined, entry.index)
    }

    case 'frame.paste': {
      if (direction === 'after') {
        const frames = [...doc.timeline.frames.slice(0, entry.at), ...entry.frames, ...doc.timeline.frames.slice(entry.at)]
        return withFocus(doc, frames, entry.frames[0]?.id, undefined, entry.at)
      }
      const pastedIds = new Set(entry.frames.map((f) => f.id))
      const frames = doc.timeline.frames.filter((f) => !pastedIds.has(f.id))
      return withFocus(doc, frames, undefined, undefined, entry.at)
    }

    default: {
      const _exhaustive: never = entry
      return doc
    }
  }
}

/**
 * Finalizes the open stroke (if any) by diffing `working` against `shadow`
 * and pushing a patch entry — the SAME logic `stroke.end` runs on pointerup,
 * reused so `stroke.begin` (re-opening while one is already open), and every
 * document-changing command dispatched mid-stroke (see
 * `STROKE_COMMIT_COMMANDS` below), `undo`, `redo` and `frame.select` can all
 * force-commit an in-progress stroke instead of silently losing or
 * corrupting it. A no-op if no stroke is open.
 */
function endOpenStroke(state: CoreState, label: string): { state: CoreState; dirty: ReadonlyArray<DirtyRect> } {
  const stroke = state.strokeState
  if (!stroke) return { state, dirty: [] }

  const frameIndex = frameIndexById(state.doc, stroke.frameId)
  const frame = frameIndex === -1 ? undefined : state.doc.timeline.frames[frameIndex]
  const layer = frame?.layers.find((l) => l.id === stroke.layerId)
  if (!frame || !layer) return { state: { ...state, strokeState: null }, dirty: [] }

  const rect = diffRect(stroke.shadow, layer.pixels)
  if (!rect) return { state: { ...state, strokeState: null }, dirty: [] }

  const entry: HistoryEntry = {
    kind: 'patch',
    label,
    frameId: stroke.frameId,
    activeLayerId: frame.activeLayerId,
    patches: [
      { layerId: stroke.layerId, rect, before: extractRect(stroke.shadow, rect), after: extractRect(layer.pixels, rect) },
    ],
  }
  const history = pushEntry(state.history, entry)
  // judgment-day round 2 (finding 1): committing a stroke bumps the render
  // revision so Zustand/Konva re-render on pointer-up, not just mid-drag.
  const revision = state.revision + 1
  // C1 fix: tag `frameId` with the frame the STROKE was bound to (`stroke.frameId`),
  // never whatever frame happens to be current when this runs — a command
  // that force-commits this stroke can go on to change which frame is
  // current in the SAME dispatch (e.g. `frame.add`), and the pixel cache must
  // refresh this layer from the frame it actually lives in.
  return {
    state: { ...state, history, strokeState: null, revision },
    dirty: [{ frameId: stroke.frameId, layerId: stroke.layerId, rect }],
  }
}

function layerMetaChanged(layer: Layer, patch: LayerMetaPatch): boolean {
  return (
    (patch.name !== undefined && patch.name !== layer.name) ||
    (patch.visible !== undefined && patch.visible !== layer.visible) ||
    (patch.locked !== undefined && patch.locked !== layer.locked) ||
    (patch.opacity !== undefined && patch.opacity !== layer.opacity)
  )
}

function layerMetaSnapshot(layer: Layer): LayerMetaSnapshot {
  return { name: layer.name, visible: layer.visible, locked: layer.locked, opacity: layer.opacity }
}

/**
 * Converts a plain, structured-clone-safe {@link SerializedFrame} into a live
 * `AnimationFrame` — fresh frame id, fresh layer ids, freshly CLONED pixel
 * buffers, always, regardless of what the caller sent (judgment-day round 2,
 * finding 6 — never aliases an id or a buffer with whatever is still sitting
 * in the clipboard). `new Uint8ClampedArray(l.data)` copies the bytes (a
 * typed array constructed from another typed array copies values; it is
 * never a view over the same memory), so the core never keeps a reference
 * into the caller's buffer (phase 2e: "core copies incoming buffers").
 */
function serializedFrameToFrame(state: CoreState, frame: SerializedFrame): AnimationFrame {
  const layerIdMap = new Map<string, string>()
  const layers: Layer[] = frame.layers.map((l) => {
    const id = nextLayerId(state)
    if (l.id) layerIdMap.set(l.id, id)
    return {
      id,
      name: l.name,
      visible: l.visible,
      locked: l.locked,
      opacity: l.opacity,
      pixels: { w: l.w, h: l.h, data: new Uint8ClampedArray(l.data) },
    }
  })
  const activeLayerId =
    (frame.activeLayerId !== undefined ? layerIdMap.get(frame.activeLayerId) : undefined) ?? layers[0]?.id ?? nextLayerId(state)
  return { id: nextFrameId(state), layers, activeLayerId, durationMs: frame.durationMs }
}

/**
 * Judgment-day round 2 (finding 2): every command that mutates the DOCUMENT
 * must first commit any open stroke — a single guard here, not scattered
 * per-case code. `stroke.begin`/`undo`/`redo`/`frame.select` already force a
 * commit themselves (for their own, slightly different reasons) and stay
 * untouched below.
 */
const STROKE_COMMIT_COMMANDS: ReadonlySet<Command['type']> = new Set([
  'frame.add',
  'frame.remove',
  'frame.paste',
  'doc.replace',
  'layer.add',
  'layer.remove',
  'layer.meta',
  'layer.reorder',
  'region.clear',
  'selection.commit',
  'fill',
])

/**
 * Judgment-day round 2 (finding 5): commands that mutate ONLY view/playback
 * state — never the persisted document. `dispatchCommand`'s wrapper uses
 * this to decide whether to bump `contentRevision` (the autosave trigger).
 */
const NON_CONTENT_COMMANDS: ReadonlySet<Command['type']> = new Set([
  'layer.setActive',
  'frame.select',
  'timeline.setFps',
  'timeline.toggleLoop',
  'timeline.setFrameSelection',
  'timeline.togglePlayback',
])

/**
 * Fix-agent 7g (store-loop performance, item 1): commands that touch ONLY the
 * pixel bytes of layers already named in `dirty` — never add/remove/reorder/
 * rename a frame or layer, never change canvas size, current frame, active
 * layer, or any `timeline.*` setting. `dispatchCommand`'s wrapper uses this
 * (independent of `NON_CONTENT_COMMANDS`, which is about autosave, not shape)
 * to compute `DispatchResult.structureChanged` — `false` for every command in
 * this set, `true` for everything else (including `undo`/`redo`, since either
 * can pop a structural history entry; see `document.rs`'s mirrored `finish`
 * call sites for the Rust side of this same rule). `core.slice.ts` uses the
 * flag to skip `PixelCore.snapshot()` entirely on the hot path (a drawing
 * gesture fires many `stroke.points` dispatches per second).
 */
const PIXEL_ONLY_COMMANDS: ReadonlySet<Command['type']> = new Set([
  'stroke.begin',
  'stroke.points',
  'stroke.end',
  'fill',
  'region.clear',
  'selection.commit',
])

/**
 * Phase 2e: the single place that assembles the explicit {@link
 * DispatchResult} every caller (the zustand slice, the `PixelCore` facade,
 * tests) relies on — `canUndo`/`canRedo`/`strokeOpen` are always computed
 * fresh from `state`, never by the caller diffing `CoreState` references.
 */
function buildResult(
  state: CoreState,
  changed: boolean,
  contentChanged: boolean,
  structureChanged: boolean,
  historyChanged: boolean,
  dirty: ReadonlyArray<DirtyRect>,
  evicted: ReadonlyArray<LayerRef>
): DispatchResult {
  return {
    changed,
    contentChanged,
    structureChanged,
    historyChanged,
    canUndo: historyCanUndo(state.history),
    canRedo: historyCanRedo(state.history),
    strokeOpen: state.strokeState !== null,
    revision: state.revision,
    contentRevision: state.contentRevision ?? state.revision,
    dirty,
    evicted,
    layerRevisions: state.layerRevisions ?? {},
  }
}

export function dispatchCommand(inputState: CoreState, cmd: Command): DispatchOutcome {
  // Bug #4: this force-commit's `dirty`/outcome used to be discarded (only
  // `.state` kept) — if the DISPATCHED command's own switch-case result was
  // itself a no-op (e.g. `layer.meta` with no actual metadata delta, fired
  // while a stroke happened to be open), the early-return branch below
  // reported `contentChanged:false`/a stale `contentRevision` even though a
  // real patch entry WAS just pushed for the force-committed stroke. Keeping
  // the commit's `dirty` rects lets the "changed" path below account for it.
  const forceCommit =
    inputState.strokeState && STROKE_COMMIT_COMMANDS.has(cmd.type)
      ? endOpenStroke(inputState, 'Draw')
      : { state: inputState, dirty: [] as ReadonlyArray<DirtyRect> }

  const switchOutcome = dispatchCommandSwitch(forceCommit.state, cmd)
  const historyChanged = switchOutcome.state.history !== inputState.history
  // C1 fix: the force-commit's dirty pair (correctly tagged with the OLD
  // frame it was bound to, see `endOpenStroke`) and the dispatched command's
  // own dirty pairs (each tagged with ITS OWN frame — a forward `frame.add`/
  // `layer.add`/`frame.paste`/`doc.replace` now reports dirty pairs for every
  // layer it just created, not just an implicit "whatever's current" guess)
  // are simply concatenated — nothing here needs to re-derive "the" current
  // frame, because every pair already knows its own.
  const dirty =
    forceCommit.dirty.length > 0 ? [...forceCommit.dirty, ...switchOutcome.result.dirty] : switchOutcome.result.dirty
  // A force-committed stroke never evicts anything (it only ever adds a patch entry).
  const evicted = switchOutcome.result.evicted ?? []
  const changed = switchOutcome.result.changed || forceCommit.dirty.length > 0

  if (!changed) {
    return {
      state: switchOutcome.state,
      result: buildResult(switchOutcome.state, false, false, false, historyChanged, dirty, evicted),
    }
  }

  let next = switchOutcome.state
  const contentChanged = !NON_CONTENT_COMMANDS.has(cmd.type) || historyChanged
  if (contentChanged) {
    next = { ...next, contentRevision: (next.contentRevision ?? 0) + 1 }
  }
  // Fix-agent 7g: a pixel-only command (see `PIXEL_ONLY_COMMANDS`'s doc) never
  // changes the document's shape/metadata — not even indirectly via a
  // force-committed stroke, which only ever pushes a 'patch' history entry.
  const structureChanged = !PIXEL_ONLY_COMMANDS.has(cmd.type)

  const dirtyLayerIds = dirty.map((d) => d.layerId)
  const layerIds =
    dirtyLayerIds.length > 0
      ? dirtyLayerIds
      : !NON_CONTENT_COMMANDS.has(cmd.type)
        ? currentLayers(next.doc).map((l) => l.id)
        : []
  if (layerIds.length > 0) {
    const layerRevisions = { ...(next.layerRevisions ?? {}) }
    for (const id of layerIds) layerRevisions[id] = (layerRevisions[id] ?? 0) + 1
    next = { ...next, layerRevisions }
  }

  return { state: next, result: buildResult(next, true, contentChanged, structureChanged, historyChanged, dirty, evicted) }
}

function dispatchCommandSwitch(state: CoreState, cmd: Command): SwitchOutcome {
  switch (cmd.type) {
    case 'stroke.begin': {
      // "stroke.begin while a stroke is open first ends (commits) the open
      // stroke". Bug #4: the commit's `dirty` rect used to be discarded
      // (only `.state` was kept) — a re-open that force-commits a REAL
      // pixel change reported `changed:false` for itself, which made
      // `dispatchCommand`'s wrapper under-report `contentChanged`/
      // `contentRevision`/`layerRevisions` for that dispatch. Carrying the
      // commit's `dirty`/`changed` through as THIS case's own result lets
      // the wrapper's normal (already-correct) "changed" path account for
      // it — no special-casing needed in the wrapper itself.
      const commit = state.strokeState ? endOpenStroke(state, 'Draw') : { state, dirty: [] as ReadonlyArray<DirtyRect> }
      const cur = commit.state
      const changed = commit.dirty.length > 0

      const layer = currentLayers(cur.doc).find((l) => l.id === cmd.layerId)
      if (!layer || layer.locked) return { state: cur, result: { dirty: commit.dirty, changed } } // locked/unknown layer: still report the force-commit, just don't open a new stroke

      const strokeState: StrokeState = {
        layerId: cmd.layerId,
        frameId: currentFrame(cur.doc).id,
        shadow: cloneBuffer(layer.pixels),
        working: cloneBuffer(layer.pixels),
      }
      return { state: { ...cur, strokeState }, result: { dirty: commit.dirty, changed } }
    }

    case 'stroke.points': {
      const stroke = state.strokeState
      if (!stroke) return noChange(state)
      if (currentFrame(state.doc).id !== stroke.frameId) return noChange(state) // frame changed out from under the stroke — ignore (defensive)
      if (cmd.points.length === 0) return noChange(state)

      // Bounds-validate every point against the canvas; out-of-range points are ignored, never wrapped into the next row.
      const color = unpackRgba(cmd.rgba) // one allocation per dispatch, reused for every point below — not per point
      let wrote = false
      let minX = Infinity
      let minY = Infinity
      let maxX = -Infinity
      let maxY = -Infinity
      for (let i = 0; i < cmd.points.length; i += 2) {
        const x = cmd.points[i]
        const y = cmd.points[i + 1]
        if (isInBounds(stroke.working, x, y)) {
          putPixel(stroke.working, x, y, color)
          wrote = true
          if (x < minX) minX = x
          if (y < minY) minY = y
          if (x > maxX) maxX = x
          if (y > maxY) maxY = y
        }
      }
      if (!wrote) return noChange(state)

      // `stroke.working` is the SAME buffer mutated in place across every
      // batch of this gesture — one clone at `stroke.begin`, not one per
      // batch. The render contract for this (judgment-day round 2, finding
      // 1) is `layerRevisions`/`dirty`, computed by the `dispatchCommand`
      // wrapper — NEVER buffer identity.
      const layers = currentLayers(state.doc).map((l) => (l.id === stroke.layerId ? { ...l, pixels: stroke.working } : l))
      const doc = withCurrentFrame(state.doc, { layers })
      const revision = state.revision + 1
      const rect = { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }
      return {
        state: { ...state, doc, revision },
        result: { dirty: [{ frameId: stroke.frameId, layerId: stroke.layerId, rect }], changed: true },
      }
    }

    case 'stroke.end': {
      if (!state.strokeState) return noChange(state)
      const { state: next, dirty } = endOpenStroke(state, cmd.label)
      return { state: next, result: { dirty, changed: dirty.length > 0 } }
    }

    case 'fill': {
      const layer = currentLayers(state.doc).find((l) => l.id === cmd.layerId)
      if (!layer) return noChange(state)
      if (layer.locked) return noChange(state)
      if (!isInBounds(layer.pixels, cmd.x, cmd.y)) return noChange(state) // out-of-bounds seed is ignored, never wrapped

      // Phase 5: the actual flood-fill computation is delegated to the
      // resolved `PixelKernels` (TS or Wasm, `pf:core` -> `VITE_PIXEL_CORE`
      // -> `ts`, automatic TS fallback on load failure/runtime trap — see
      // `./kernels.ts`), NOT this file's own `../flood-fill.ts` any more.
      // Every bound/lock/no-op check around it is UNCHANGED, so undo
      // semantics (a dirty-rect patch entry, a `(frameId, layerId)` dirty
      // pair) stay identical regardless of which kernel ran.
      const before = layer.pixels
      const working = cloneBuffer(before)
      const kernelRect = getActiveKernels().floodFill(asKernelBuffer(working.data), working.w, working.h, cmd.x, cmd.y, cmd.rgba)
      if (!kernelRect) return noChange(state) // target color === fill color — the kernel's own no-op short-circuit
      const after = working

      const rect: Rect = { x: kernelRect[0], y: kernelRect[1], w: kernelRect[2], h: kernelRect[3] }

      const layers = currentLayers(state.doc).map((l) => (l.id === cmd.layerId ? { ...l, pixels: after } : l))
      const doc = withCurrentFrame(state.doc, { layers })

      const history = pushEntry(state.history, {
        kind: 'patch',
        label: cmd.label ?? 'Draw',
        frameId: currentFrame(doc).id,
        activeLayerId: currentActiveLayerId(doc),
        patches: [{ layerId: cmd.layerId, rect, before: extractRect(before, rect), after: extractRect(after, rect) }],
      })

      const revision = state.revision + 1
      return {
        state: { ...state, doc, history, revision },
        result: { dirty: [{ frameId: currentFrame(doc).id, layerId: cmd.layerId, rect }], changed: true },
      }
    }

    case 'frame.add': {
      const newLayer: Layer = {
        id: nextLayerId(state),
        name: `${SPRITE_EDITOR_DEFAULTS.LAYER_NAME_PREFIX} 1`,
        visible: true,
        locked: false,
        opacity: SPRITE_EDITOR_LAYER.DEFAULT_OPACITY,
        pixels: createEmptyBuffer(state.doc.canvasWidth, state.doc.canvasHeight),
      }
      const newFrame: AnimationFrame = {
        id: nextFrameId(state),
        layers: [newLayer],
        activeLayerId: newLayer.id,
        durationMs: Math.round(MS_PER_SECOND / state.doc.timeline.fps),
      }
      const index = state.doc.timeline.frames.length
      const frames = [...state.doc.timeline.frames, newFrame]
      const doc: DocSnapshot = {
        ...state.doc,
        timeline: { ...state.doc.timeline, frames, currentFrameIndex: index, selectedFrameIndices: [index] },
      }

      const history = pushEntry(state.history, { kind: 'frame.add', label: 'Add Frame', frame: newFrame, index })
      const revision = state.revision + 1
      // C1 fix: report the new frame's new layer as dirty explicitly — never
      // rely on "whatever's current after this dispatch" (the wrapper's
      // dirty-is-empty fallback), which breaks the moment this ALSO force-
      // commits a stroke that was open on the frame that was current BEFORE
      // this add (see commands.ts's `DirtyRect` doc).
      return {
        state: withState(state, { doc, history, strokeState: null, revision }),
        result: { dirty: fullDirty(newFrame), changed: true },
      }
    }

    case 'frame.remove': {
      if (state.doc.timeline.frames.length <= 1) return noChange(state)
      // Fix-agent 7g (item 3, CONFIRMED bug): a FRACTIONAL in-range index
      // (e.g. `1.5` with 3 frames) used to pass this guard (neither `<0` nor
      // `>=length`), then `frames[1.5]` read back `undefined` for
      // `removedFrame`, `frames.filter((_, i) => i !== 1.5)` removed NOTHING
      // (every integer `i` is `!== 1.5`), yet a corrupt history entry
      // (`frame: undefined`) was still pushed and `changed:true` reported —
      // silent data corruption that crashes LATER on undo (`entry.frame.id`).
      // `Number.isInteger` added to the guard makes this a clean no-op.
      if (!Number.isInteger(cmd.index) || cmd.index < 0 || cmd.index >= state.doc.timeline.frames.length) return noChange(state) // out-of-range index is a no-op, not a crash

      const removedFrame = state.doc.timeline.frames[cmd.index]
      const frames = state.doc.timeline.frames.filter((_, i) => i !== cmd.index)
      const newCurrentIndex = Math.min(
        state.doc.timeline.currentFrameIndex > cmd.index
          ? state.doc.timeline.currentFrameIndex - 1
          : state.doc.timeline.currentFrameIndex,
        frames.length - 1
      )

      const doc: DocSnapshot = {
        ...state.doc,
        timeline: { ...state.doc.timeline, frames, currentFrameIndex: newCurrentIndex, selectedFrameIndices: [newCurrentIndex] },
      }

      const history = pushEntry(state.history, { kind: 'frame.remove', label: 'Remove Frame', frame: removedFrame, index: cmd.index })
      const revision = state.revision + 1
      // C1 fix: evict the removed frame's layers from the pixel cache — it is
      // keyed globally by layer id, so a removed id must be dropped
      // explicitly or it lingers forever (harmless today, but wrong once ids
      // could ever be reused, and simply a leak otherwise).
      return {
        state: withState(state, { doc, history, strokeState: null, revision }),
        result: { dirty: [], changed: true, evicted: fullRefs(removedFrame) },
      }
    }

    case 'doc.replace': {
      if (cmd.frames.length === 0) return noChange(state)

      // Bug #2 (W5 hardened): validate every incoming frame's buffer against
      // the DECLARED canvas size AND its actual byte length before accepting
      // it — a size mismatch used to brick the draft silently (a layer whose
      // `pixels.data` doesn't match `w*h*4` breaks every later read/render/
      // persist round-trip). The w/h-only check used to miss a buffer whose
      // DECLARED dimensions matched but whose `data` was actually shorter/
      // longer (e.g. `{w:2,h:2,data:new Uint8ClampedArray(5)}`) — validated
      // here too now. Reject the whole replace instead (no-op,
      // `changed:false`); never resample.
      const sizeMismatch = cmd.frames.some(
        (f) => f.pixels.w !== cmd.canvasWidth || f.pixels.h !== cmd.canvasHeight || f.pixels.data.byteLength !== cmd.canvasWidth * cmd.canvasHeight * CHANNELS
      )
      if (sizeMismatch) return noChange(state)

      const before = snapshotStructural(state.doc)

      const fps =
        cmd.frameDurationMs > 0
          ? Math.min(
              SPRITE_EDITOR_TIMELINE.MAX_FPS,
              Math.max(SPRITE_EDITOR_TIMELINE.MIN_FPS, Math.round(MS_PER_SECOND / cmd.frameDurationMs))
            )
          : SPRITE_EDITOR_TIMELINE.DEFAULT_FPS

      // Phase 2e: `cloneBuffer` — the core copies incoming buffers, it never
      // keeps a reference into the caller's (e.g. an AI-generation response
      // the caller may still hold/reuse).
      const frames: AnimationFrame[] = cmd.frames.map((f) => {
        const layer: Layer = {
          id: nextLayerId(state),
          name: `${SPRITE_EDITOR_DEFAULTS.LAYER_NAME_PREFIX} 1`,
          visible: true,
          locked: false,
          opacity: SPRITE_EDITOR_LAYER.DEFAULT_OPACITY,
          pixels: cloneBuffer(f.pixels),
        }
        return { id: nextFrameId(state), layers: [layer], activeLayerId: layer.id, durationMs: cmd.frameDurationMs }
      })

      const doc: DocSnapshot = {
        canvasWidth: cmd.canvasWidth,
        canvasHeight: cmd.canvasHeight,
        timeline: {
          frames,
          currentFrameIndex: 0,
          isPlaying: false,
          fps,
          loop: true,
          selectedFrameIndices: [0],
        },
      }

      const after = snapshotStructural(doc)
      const history = pushEntry(state.history, { kind: 'doc.replace', label: cmd.label, before, after })
      const revision = state.revision + 1
      // C1 fix: `doc.replace` swaps the ENTIRE document — every new frame's
      // layer is dirty (must be read into the cache), and every OLD frame's
      // layer must be evicted (its id will never be read again).
      return {
        state: withState(state, { doc, history, strokeState: null, revision }),
        result: { dirty: frames.flatMap(fullDirty), changed: true, evicted: before.timeline.frames.flatMap(fullRefs) },
      }
    }

    case 'undo': {
      // "undo ... end any open stroke" — commit it first so undo acts on a consistent, up-to-date history stack.
      const cur = endOpenStroke(state, 'Draw').state
      const popped = popUndo(cur.history)
      if (!popped) return noChange(cur)
      const doc = applyEntry(cur.doc, popped.entry, 'before')
      const revision = cur.revision + 1
      // W8 fix: refresh/evict only the exact (frame, layer) pairs `popped.entry`
      // actually touched, via `dirtyAndEvictedOf` — never a blanket sweep of
      // every layer of every frame (that used to be the ONLY way the pixel
      // cache could stay correct across a structural undo/redo; it is no
      // longer needed now every entry kind reports precise pairs).
      const { dirty, evicted } = dirtyAndEvictedOf(popped.entry, 'before')
      return {
        state: withState(cur, { doc, history: popped.history, strokeState: null, revision }),
        result: { dirty, changed: true, evicted },
      }
    }

    case 'redo': {
      const cur = endOpenStroke(state, 'Draw').state
      const popped = popRedo(cur.history)
      if (!popped) return noChange(cur)
      const doc = applyEntry(cur.doc, popped.entry, 'after')
      const revision = cur.revision + 1
      const { dirty, evicted } = dirtyAndEvictedOf(popped.entry, 'after')
      return {
        state: withState(cur, { doc, history: popped.history, strokeState: null, revision }),
        result: { dirty, changed: true, evicted },
      }
    }

    // ── Undoable: layer CRUD ─────────────────────────────────────────────

    case 'layer.add': {
      const layers = currentLayers(state.doc)
      const frameId = currentFrame(state.doc).id
      const newLayer: Layer = {
        id: nextLayerId(state),
        name: `${SPRITE_EDITOR_DEFAULTS.LAYER_NAME_PREFIX} ${layers.length + 1}`,
        visible: true,
        locked: false,
        opacity: SPRITE_EDITOR_LAYER.DEFAULT_OPACITY,
        pixels: createEmptyBuffer(state.doc.canvasWidth, state.doc.canvasHeight),
      }
      const doc = withCurrentFrame(state.doc, { layers: [...layers, newLayer], activeLayerId: newLayer.id })
      const history = pushEntry(state.history, {
        kind: 'layer.add',
        label: 'Add Layer',
        frameId,
        layer: newLayer,
        index: layers.length,
      })
      const revision = state.revision + 1
      // C1 fix: the new layer is dirty immediately — it has a brand-new id
      // the pixel cache has never seen, so it must never rely on an implicit
      // "refresh whatever's current" fallback alone.
      return {
        state: { ...state, doc, history, revision },
        result: { dirty: [{ frameId, layerId: newLayer.id, rect: fullRect(newLayer.pixels) }], changed: true },
      }
    }

    case 'layer.remove': {
      const layers = currentLayers(state.doc)
      if (layers.length <= 1) return noChange(state)
      const index = layers.findIndex((l) => l.id === cmd.layerId)
      if (index === -1) return noChange(state) // layerId not found — no-op

      const frameId = currentFrame(state.doc).id
      const removedLayer = layers[index]
      const filtered = layers.filter((_, i) => i !== index)
      const activeLayerId = currentActiveLayerId(state.doc) === cmd.layerId ? filtered[0].id : currentActiveLayerId(state.doc)
      const doc = withCurrentFrame(state.doc, { layers: filtered, activeLayerId })
      const history = pushEntry(state.history, {
        kind: 'layer.remove',
        label: 'Remove Layer',
        frameId,
        layer: removedLayer,
        index,
      })
      const revision = state.revision + 1
      // C1 fix: evict the removed layer's cache entry (global-by-layer-id cache).
      return {
        state: { ...state, doc, history, revision },
        result: { dirty: [], changed: true, evicted: [{ frameId, layerId: removedLayer.id }] },
      }
    }

    case 'layer.meta': {
      const layers = currentLayers(state.doc)
      const target = layers.find((l) => l.id === cmd.layerId)
      if (!target) return noChange(state)
      if (!layerMetaChanged(target, cmd.patch)) return noChange(state) // no actual change — no-op, no entry

      const frameId = currentFrame(state.doc).id
      const before = layerMetaSnapshot(target)
      const newLayers = layers.map((l) => (l.id === cmd.layerId ? { ...l, ...cmd.patch } : l))
      const after = layerMetaSnapshot({ ...target, ...cmd.patch })
      const doc = withCurrentFrame(state.doc, { layers: newLayers })
      const history = pushEntry(state.history, {
        kind: 'layer.meta',
        label: 'Layer Properties',
        frameId,
        layerId: cmd.layerId,
        before,
        after,
      })
      const revision = state.revision + 1
      return { state: { ...state, doc, history, revision }, result: { dirty: [], changed: true } }
    }

    case 'layer.reorder': {
      // Fix-agent 7g (item 3, CONFIRMED CRASH bug): a FRACTIONAL in-range
      // `from`/`to` (e.g. `from: 1.5` with 3 layers) used to pass the range
      // check below (neither `<0` nor `>=length`), then `layers[1.5]` read
      // back `undefined` for `movedLayerId`, and `.id` on `undefined` threw
      // an uncaught `TypeError` — crashing the whole dispatch. `Number.
      // isInteger` added to the guard makes this a clean no-op instead.
      if (!Number.isInteger(cmd.from) || !Number.isInteger(cmd.to) || cmd.from === cmd.to) return noChange(state) // no actual change
      const layers = currentLayers(state.doc)
      if (cmd.from < 0 || cmd.from >= layers.length || cmd.to < 0 || cmd.to >= layers.length) return noChange(state)

      const frameId = currentFrame(state.doc).id
      const movedLayerId = layers[cmd.from].id
      const reordered = [...layers]
      const [moved] = reordered.splice(cmd.from, 1)
      reordered.splice(cmd.to, 0, moved)
      const doc = withCurrentFrame(state.doc, { layers: reordered })
      const history = pushEntry(state.history, {
        kind: 'layer.reorder',
        label: 'Reorder Layers',
        frameId,
        layerId: movedLayerId,
        from: cmd.from,
        to: cmd.to,
      })
      const revision = state.revision + 1
      return { state: { ...state, doc, history, revision }, result: { dirty: [], changed: true } }
    }

    // ── Non-undoable: view state (selecting a layer is not a document edit) ─

    case 'layer.setActive': {
      // judgment-day round 2 (finding 7): an unknown layer id is a no-op — activeLayerId must never dangle.
      if (!currentLayers(state.doc).some((l) => l.id === cmd.layerId)) return noChange(state)
      const doc = withCurrentFrame(state.doc, { activeLayerId: cmd.layerId })
      const revision = state.revision + 1
      return { state: { ...state, doc, revision }, result: { dirty: [], changed: true } }
    }

    // ── Non-undoable: frame navigation (view state) ─────────────────────────

    case 'frame.select': {
      const index = cmd.index
      // Fix-agent 7g (item 3): explicit integer check — `frames[index]` is
      // already an accidental no-op for a fractional/negative index (array
      // indexing with a non-integer key never matches), but making it
      // explicit documents the invariant instead of relying on that JS quirk.
      if (!Number.isInteger(index) || !state.doc.timeline.frames[index]) return noChange(state)
      // "frame.select ... end any open stroke". C1 fix: the committed
      // stroke's `dirty` pair (tagged with the frame it was bound to, NOT
      // the frame we're about to switch to) must be carried through — this
      // case changes `currentFrameIndex` itself, so discarding it here would
      // be the exact C1 bug (a dirty layer on a frame that is no longer
      // current by the time anything reads the result).
      const commit = endOpenStroke(state, 'Draw')
      const cur = commit.state
      const doc: DocSnapshot = {
        ...cur.doc,
        timeline: { ...cur.doc.timeline, currentFrameIndex: index, selectedFrameIndices: [index] },
      }
      const revision = cur.revision + 1
      return { state: { ...cur, doc, revision }, result: { dirty: commit.dirty, changed: true } }
    }

    // ── Undoable: frame CRUD / clipboard paste ──────────────────────────────

    case 'frame.paste': {
      // Fix-agent 7g (item 3, CONFIRMED corruption bug): `at` used to be only
      // `Math.max(0, Math.min(cmd.at, length))`-clamped, never checked for
      // integer-ness — a fractional `at` (e.g. `1.5`) survived clamping
      // unchanged and was then stored directly as `currentFrameIndex: 1.5`.
      // `Array.prototype.splice` silently TRUNCATES a fractional `start`
      // argument (so the paste itself landed at index 1, not 1.5), but the
      // STORED `currentFrameIndex` stayed fractional — `frames[1.5]` is
      // `undefined`, so `currentFrame(doc)` and everything built on it
      // (`currentLayers`, the NEXT dispatch's force-commit logic, etc.)
      // would crash on the very next command. A clean no-op instead.
      if (cmd.frames.length === 0 || !Number.isInteger(cmd.at)) return noChange(state)
      // Bug #2 (W5 hardened): reject a paste whose layers don't match the
      // CURRENT canvas size, whose `data` byte length doesn't match
      // `w*h*4` for the DECLARED size (a declared-size-only check missed a
      // layer whose `data` was actually shorter/longer than its own `w*h*4`
      // — e.g. `{w:2,h:2,data:new Uint8Array(3)}` — and that corrupted
      // buffer would have been handed straight to `new Uint8ClampedArray` in
      // `serializedFrameToFrame`), or that has ZERO layers (every frame in
      // this core must have at least one layer — an empty one would mint a
      // dangling `activeLayerId` with nothing to resolve to). No-op, never
      // resample/synthesize; the clipboard itself is cleared by the caller
      // once the canvas is resized (see `compound.slice.ts`'s
      // `overwriteWithPixels`/`importAnimationFrames`).
      const invalid = cmd.frames.some(
        (f) =>
          f.layers.length === 0 ||
          f.layers.some(
            (l) =>
              l.w !== state.doc.canvasWidth || l.h !== state.doc.canvasHeight || l.data.byteLength !== l.w * l.h * CHANNELS
          )
      )
      if (invalid) return noChange(state)

      // judgment-day round 2 (finding 6/7): deep-copy with fresh ids/buffers, and clamp `at` into range.
      const freshFrames = cmd.frames.map((f) => serializedFrameToFrame(state, f))
      const at = Math.max(0, Math.min(cmd.at, state.doc.timeline.frames.length))
      const frames = [...state.doc.timeline.frames]
      frames.splice(at, 0, ...freshFrames)
      const pastedIndices = freshFrames.map((_, i) => at + i)
      const doc: DocSnapshot = {
        ...state.doc,
        timeline: { ...state.doc.timeline, frames, currentFrameIndex: at, selectedFrameIndices: pastedIndices },
      }
      const history = pushEntry(state.history, { kind: 'frame.paste', label: 'Paste Frames', frames: freshFrames, at })
      const revision = state.revision + 1
      // C1 fix: every pasted frame's every (brand-new-id) layer is dirty.
      return {
        state: withState(state, { doc, history, strokeState: null, revision }),
        result: { dirty: freshFrames.flatMap(fullDirty), changed: true },
      }
    }

    // ── Undoable: selection/clipboard pixel ops ─────────────────────────────

    case 'selection.commit': {
      const layers = currentLayers(state.doc)
      const layer = layers.find((l) => l.id === cmd.layerId)
      if (!layer) return noChange(state)
      if (layer.locked) return noChange(state)

      const { at } = cmd
      // Boundary validation (phase 2e, task "all indices/ids validated"): an
      // out-of-range rect is a no-op, never a crash/throw/out-of-bounds write.
      if (at.w <= 0 || at.h <= 0) return noChange(state)
      if (at.x < 0 || at.y < 0 || at.x + at.w > layer.pixels.w || at.y + at.h > layer.pixels.h) return noChange(state)
      if (cmd.pixels.byteLength !== at.w * at.h * 4) return noChange(state)

      const before = extractRect(layer.pixels, at)
      const afterView = new Uint8Array(cmd.pixels.buffer, cmd.pixels.byteOffset, cmd.pixels.byteLength)
      if (bytesEqual(before, afterView)) return noChange(state) // identical pixels — no actual change, no entry

      const newPixelsBuffer = writeRect(layer.pixels, at, afterView)
      const newLayers = layers.map((l) => (l.id === cmd.layerId ? { ...l, pixels: newPixelsBuffer } : l))
      const doc = withCurrentFrame(state.doc, { layers: newLayers })
      const history = pushEntry(state.history, {
        kind: 'patch',
        label: 'Transform',
        frameId: currentFrame(doc).id,
        activeLayerId: currentActiveLayerId(doc),
        // `new Uint8Array(afterView)` copies the bytes into the entry — the
        // history never keeps a reference into the command's own buffer.
        patches: [{ layerId: cmd.layerId, rect: at, before, after: new Uint8Array(afterView) }],
      })
      const revision = state.revision + 1
      return {
        state: { ...state, doc, history, revision },
        result: { dirty: [{ frameId: currentFrame(doc).id, layerId: cmd.layerId, rect: at }], changed: true },
      }
    }

    case 'region.clear': {
      const layers = currentLayers(state.doc)
      const layer = layers.find((l) => l.id === cmd.layerId)
      if (!layer) return noChange(state)
      if (layer.locked) return noChange(state)

      // Bug #5: clamp the rect to the canvas FIRST, then write ONE
      // zero-filled patch via `writeRect` — the old code looped over the
      // UNCLAMPED rect (which can be negative-origin or far larger than the
      // canvas, e.g. from a drag-selection gone past the edge) allocating
      // one `{x,y,color}` object per pixel, most of which `isInBounds` then
      // threw away. All-zero bytes are exactly `TRANSPARENT_COLOR`
      // (r:0,g:0,b:0,a:0), so no per-pixel color object is needed either.
      const clamped = clampRectToBuffer(cmd.rect, layer.pixels.w, layer.pixels.h)
      if (!clamped) return noChange(state)

      const before = layer.pixels
      const transparentPatch = new Uint8Array(clamped.w * clamped.h * 4)
      const newPixels = writeRect(before, clamped, transparentPatch)
      const rect = diffRect(before, newPixels)
      if (!rect) return noChange(state) // region was already fully transparent — no actual change

      const newLayers = layers.map((l) => (l.id === cmd.layerId ? { ...l, pixels: newPixels } : l))
      const doc = withCurrentFrame(state.doc, { layers: newLayers })
      const history = pushEntry(state.history, {
        kind: 'patch',
        label: 'Clear',
        frameId: currentFrame(doc).id,
        activeLayerId: currentActiveLayerId(doc),
        patches: [{ layerId: cmd.layerId, rect, before: extractRect(before, rect), after: extractRect(newPixels, rect) }],
      })
      const revision = state.revision + 1
      return {
        state: { ...state, doc, history, revision },
        result: { dirty: [{ frameId: currentFrame(doc).id, layerId: cmd.layerId, rect }], changed: true },
      }
    }

    // ── Non-undoable: playback/view prefs — never reverted by document undo ──

    case 'timeline.setFps': {
      // Fix-agent 7g (item 3): round BEFORE clamping — matches `WasmPixelCore`'s
      // facade, which now does the same `Math.round` before `cmd.fps` crosses
      // into Rust's `u32` parameter (which would otherwise TRUNCATE toward
      // zero via the JS-to-Wasm numeric ABI, diverging from TS's un-rounded
      // fractional fps for a `.5`+ value — e.g. `12.7` truncates to `12` on
      // Wasm but used to store `12.7` as-is on TS).
      const fps = Math.max(SPRITE_EDITOR_TIMELINE.MIN_FPS, Math.min(SPRITE_EDITOR_TIMELINE.MAX_FPS, Math.round(cmd.fps)))
      const doc: DocSnapshot = { ...state.doc, timeline: { ...state.doc.timeline, fps } }
      const revision = state.revision + 1
      return { state: { ...state, doc, revision }, result: { dirty: [], changed: true } }
    }

    case 'timeline.toggleLoop': {
      const doc: DocSnapshot = { ...state.doc, timeline: { ...state.doc.timeline, loop: !state.doc.timeline.loop } }
      const revision = state.revision + 1
      return { state: { ...state, doc, revision }, result: { dirty: [], changed: true } }
    }

    case 'timeline.setFrameSelection': {
      // Boundary validation: unknown/out-of-range frame indices are dropped,
      // never stored (a Wasm core would have no way to validate an index it
      // never sees individually otherwise).
      const valid = cmd.indices.filter((i) => Number.isInteger(i) && i >= 0 && i < state.doc.timeline.frames.length)
      const doc: DocSnapshot = { ...state.doc, timeline: { ...state.doc.timeline, selectedFrameIndices: valid } }
      const revision = state.revision + 1
      return { state: { ...state, doc, revision }, result: { dirty: [], changed: true } }
    }

    case 'timeline.togglePlayback': {
      const doc: DocSnapshot = { ...state.doc, timeline: { ...state.doc.timeline, isPlaying: !state.doc.timeline.isPlaying } }
      const revision = state.revision + 1
      return { state: { ...state, doc, revision }, result: { dirty: [], changed: true } }
    }

    default: {
      const _exhaustive: never = cmd
      return noChange(state)
    }
  }
}

export function coreCanUndo(state: CoreState): boolean {
  return historyCanUndo(state.history)
}

export function coreCanRedo(state: CoreState): boolean {
  return historyCanRedo(state.history)
}

/**
 * Reads a layer's live pixel buffer by stable frame/layer id (phase 2e,
 * design's `PixelCore.readLayer`). Returns a VIEW into the buffer the core
 * owns — valid only until the next `dispatch` (same contract a future Wasm
 * core's linear-memory view would have, design D7). Unknown ids are a
 * boundary-validation no-op: an empty `Uint8ClampedArray`, never a throw.
 */
export function readLayer(state: CoreState, frameId: string, layerId: string): Uint8ClampedArray {
  const frame = state.doc.timeline.frames.find((f) => f.id === frameId)
  const layer = frame?.layers.find((l) => l.id === layerId)
  return layer ? layer.pixels.data : new Uint8ClampedArray(0)
}

// ── Persistence (export/import) ─────────────────────────────────────────────
// Replaces phase 1's `lib/document-payload.ts` (D14: only the PRODUCER of the
// payload changes — the repository/adapters underneath are untouched).

function layerToPayload(layer: Layer): DocumentLayerPayload {
  return {
    id: layer.id,
    name: layer.name,
    visible: layer.visible,
    locked: layer.locked,
    opacity: layer.opacity,
    data: new Uint8Array(layer.pixels.data),
  }
}

export function docToPayload(doc: DocSnapshot): DocumentPayload {
  return {
    schemaVersion: DOCUMENT_SCHEMA_VERSION,
    w: doc.canvasWidth,
    h: doc.canvasHeight,
    frameMs: doc.timeline.frames.map((f) => f.durationMs),
    frames: doc.timeline.frames.map((f) => ({ id: f.id, activeLayerId: f.activeLayerId, layers: f.layers.map(layerToPayload) })),
  }
}

function payloadLayerToLayer(layer: DocumentLayerPayload, w: number, h: number): Layer {
  return {
    id: layer.id,
    name: layer.name,
    visible: layer.visible,
    locked: layer.locked,
    opacity: layer.opacity,
    pixels: { w, h, data: new Uint8ClampedArray(layer.data) },
  }
}

function isValidLayerPayload(layer: DocumentLayerPayload, w: number, h: number): boolean {
  return layer.data.byteLength === w * h * 4
}

/**
 * W4 fix: a one-shot (frame id, layer id) minter sharing the EXACT same
 * `${idSeed}-f${n}`/`${idSeed}-l${n}` scheme `nextFrameId`/`nextLayerId` use
 * on a real `CoreState` — used by `payloadToDoc`'s fallback-layer synthesis
 * and duplicate-id repair, and by `createEmptyDocSnapshot`, neither of which
 * has a `CoreState` to mint through yet (this minting HAPPENS BEFORE
 * `createCoreState` runs — `TsPixelCore.importDocument` calls
 * `createCoreState(payloadToDoc(doc))`, in that order). Consumes
 * `idSeedOverride` exactly like `createCoreState` does, so a deterministic
 * test that calls `setIdSeed` before `importDocument` still gets the
 * documented one-shot behavior.
 */
function makeLocalIdMinter(): { nextFrameId: () => string; nextLayerId: () => string } {
  const seed = idSeedOverride ?? randomIdSeed()
  idSeedOverride = null
  let f = 0
  let l = 0
  return {
    nextFrameId: () => `${seed}-f${++f}`,
    nextLayerId: () => `${seed}-l${++l}`,
  }
}

function createFallbackLayer(w: number, h: number, minter: { nextLayerId: () => string }): Layer {
  return {
    id: minter.nextLayerId(),
    name: `${SPRITE_EDITOR_DEFAULTS.LAYER_NAME_PREFIX} 1`,
    visible: true,
    locked: false,
    opacity: SPRITE_EDITOR_LAYER.DEFAULT_OPACITY,
    pixels: createEmptyBuffer(w, h),
  }
}

/** The empty document `payloadToDoc` falls back to when a stored draft is too corrupted to recover anything from. */
function createEmptyDocSnapshot(): DocSnapshot {
  const w = SPRITE_EDITOR_CANVAS.DEFAULT_WIDTH
  const h = SPRITE_EDITOR_CANVAS.DEFAULT_HEIGHT
  const minter = makeLocalIdMinter()
  const layer = createFallbackLayer(w, h, minter)
  const frame: AnimationFrame = {
    id: minter.nextFrameId(),
    layers: [layer],
    activeLayerId: layer.id,
    durationMs: SPRITE_EDITOR_TIMELINE.DEFAULT_FRAME_DURATION_MS,
  }
  return {
    canvasWidth: w,
    canvasHeight: h,
    timeline: {
      frames: [frame],
      currentFrameIndex: 0,
      isPlaying: false,
      fps: SPRITE_EDITOR_TIMELINE.DEFAULT_FPS,
      loop: true,
      selectedFrameIndices: [0],
    },
  }
}

/**
 * Inverse of {@link docToPayload}. Bug #2 (defensive restore): a corrupted or
 * truncated stored draft must never crash the editor. A layer whose encoded
 * byte length doesn't match `w*h*4` for the declared canvas size is SKIPPED
 * (logged via `console.error`) rather than trusted as-is — a frame that
 * loses every layer this way gets one synthesized blank layer instead, so
 * the "every frame has at least one layer" invariant the rest of the core
 * relies on always holds. If the payload is so corrupted that not even one
 * frame can be built at all (missing/empty `frames`, non-positive canvas
 * size), this falls back to a brand-new EMPTY document and logs via
 * `console.error` — it never throws, and it never re-saves over the
 * corrupted draft itself (the caller only re-persists on the next real
 * edit, so the original stored bytes are left untouched for a future
 * recovery attempt).
 */
export function payloadToDoc(payload: DocumentPayload): DocSnapshot {
  try {
    if (!payload || payload.w <= 0 || payload.h <= 0 || !Array.isArray(payload.frames) || payload.frames.length === 0) {
      throw new Error('payloadToDoc: payload has no frames, or an invalid canvas size')
    }

    // Fix-agent 5f.2 (`setIdSeed` discarded on the `importDocument` path):
    // `makeLocalIdMinter()` itself consumes-and-nulls `idSeedOverride` the
    // instant it's CALLED, not when a minted id is actually used. This used
    // to be called unconditionally here, even for a perfectly healthy
    // payload with no corrupted layers and no duplicate ids — the
    // overwhelmingly common case — which meant `TsPixelCore.importDocument`
    // (`createCoreState(payloadToDoc(doc))`, evaluated in that argument
    // order) silently burned `setIdSeed`'s one-shot override before
    // `createCoreState` ever got to see it, so the NEXT core always minted
    // ids under a fresh random prefix instead of the requested seed. Fixed
    // by making the minter LAZY: it is constructed (and only THEN consumes
    // `idSeedOverride`) the first time this payload actually needs to mint a
    // fallback layer or repair a duplicate id — for a healthy payload it is
    // never constructed at all, leaving `idSeedOverride` intact for
    // `createCoreState` to consume as documented.
    let minter: ReturnType<typeof makeLocalIdMinter> | null = null
    const getMinter = (): ReturnType<typeof makeLocalIdMinter> => (minter ??= makeLocalIdMinter())
    // W4 fix: the pixel cache (`stores/slices/core.slice.ts`) is keyed
    // GLOBALLY by layer id (never scoped to a frame) — a payload with the
    // SAME layer id reused across two different frames (corrupted storage, a
    // hand-edited export, a bug upstream) would silently alias one frame's
    // cache entry onto the other's. Frame ids are deduplicated for the same
    // reason (`frameIndexById`/history entries address frames by id, never
    // by array position). First occurrence keeps its id; every later
    // duplicate gets a fresh one instead of being dropped or crashing.
    const seenFrameIds = new Set<string>()
    const seenLayerIds = new Set<string>()

    const frames: AnimationFrame[] = payload.frames.map((f: DocumentFramePayload, i: number) => {
      const validLayers = f.layers.filter((l) => isValidLayerPayload(l, payload.w, payload.h))
      if (validLayers.length < f.layers.length) {
        console.error(
          `payloadToDoc: dropped ${f.layers.length - validLayers.length} corrupted layer(s) in frame "${f.id}" (byte length mismatch for ${payload.w}x${payload.h})`
        )
      }
      let layers =
        validLayers.length > 0
          ? validLayers.map((l) => payloadLayerToLayer(l, payload.w, payload.h))
          : [createFallbackLayer(payload.w, payload.h, getMinter())]

      layers = layers.map((l) => {
        if (!seenLayerIds.has(l.id)) {
          seenLayerIds.add(l.id)
          return l
        }
        console.error(`payloadToDoc: duplicate layer id "${l.id}" in frame "${f.id}" — assigning a fresh id`)
        const fresh = { ...l, id: getMinter().nextLayerId() }
        seenLayerIds.add(fresh.id)
        return fresh
      })

      let frameId = f.id
      if (seenFrameIds.has(frameId)) {
        console.error(`payloadToDoc: duplicate frame id "${frameId}" — assigning a fresh id`)
        frameId = getMinter().nextFrameId()
      }
      seenFrameIds.add(frameId)

      const activeLayerId = layers.some((l) => l.id === f.activeLayerId) ? f.activeLayerId : layers[0].id

      return {
        id: frameId,
        activeLayerId,
        layers,
        durationMs: payload.frameMs[i] ?? SPRITE_EDITOR_TIMELINE.DEFAULT_FRAME_DURATION_MS,
      }
    })

    return {
      canvasWidth: payload.w,
      canvasHeight: payload.h,
      timeline: {
        frames,
        currentFrameIndex: 0,
        isPlaying: false,
        fps: SPRITE_EDITOR_TIMELINE.DEFAULT_FPS,
        loop: true,
        selectedFrameIndices: [0],
      },
    }
  } catch (error) {
    console.error('payloadToDoc: corrupted document payload — falling back to a new empty document', error)
    return createEmptyDocSnapshot()
  }
}
