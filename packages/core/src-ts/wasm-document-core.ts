/**
 * Phase 7: `WasmPixelCore` — the Wasm-backed `PixelCore` (full document +
 * history), satisfying the SAME interface `TsPixelCore`
 * (`apps/editor/src/lib/core/pixel-core.ts`) does. See `document-types.ts`'s
 * module doc for why the types here are a structural duplicate rather than a
 * shared import, and `../src/document.rs`'s module doc for the id-handle
 * design this file is the JS half of.
 *
 * This file is the "TS facade flattens nested payloads" piece design.md
 * calls for (D6): every `Command` whose payload is already flat (ids,
 * indices, scalars, typed arrays) maps to ONE matching `WasmDocument` method
 * 1:1; `doc.replace`/`frame.paste`/construction/`importDocument` — the
 * genuinely nested, multi-frame/multi-layer payloads — are flattened here
 * into the numeric-array + length-prefixed-names + concatenated-pixel-bytes
 * wire format `Document::from_payload`'s doc (`../src/document.rs`) defines.
 */
import type {
  Command,
  DirtyRect,
  DispatchResult,
  DocMetaSnapshot,
  DocSnapshot,
  DocumentFramePayload,
  DocumentLayerPayload,
  DocumentPayload,
  FrameId,
  LayerId,
  LayerRef,
  PixelBuffer,
  PixelCore,
  Rect,
  SerializedFrame,
} from './document-types'

// wasm-pack's `--target web` output — see `wasm-core.ts`'s identical comment.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WasmExports = typeof import('../pkg/pixelforge_core')
type WasmDocumentHandle = InstanceType<WasmExports['WasmDocument']>

/** Mirrors `apps/editor/src/constants/persistence.ts`'s `DOCUMENT_SCHEMA_VERSION` — duplicated here for the same reason `document-types.ts` duplicates its types (see that file's module doc). Keep in sync by hand until the follow-up hoist. */
const DOCUMENT_SCHEMA_VERSION = 1
/** Mirrors `apps/editor/src/constants/index.ts`'s `SPRITE_EDITOR_TIMELINE.DEFAULT_FPS`. */
const DEFAULT_FPS = 12
/** Mirrors `apps/editor/src/constants/index.ts`'s `SPRITE_EDITOR_TIMELINE.DEFAULT_FRAME_DURATION_MS` — fix-agent 7g (item 2): used by `repairDocumentPayload` for a frame whose `frameMs` entry is missing/undefined, same fallback `ts-core.ts`'s `payloadToDoc` uses (`payload.frameMs[i] ?? DEFAULT_FRAME_DURATION_MS`). */
const DEFAULT_FRAME_DURATION_MS = 83
/** Mirrors `apps/editor/src/constants/index.ts`'s `SPRITE_EDITOR_DEFAULTS.LAYER_NAME_PREFIX` — fix-agent 7g (item 2): used by `repairDocumentPayload`'s fallback-layer synthesis, same name `ts-core.ts`'s `createFallbackLayer` gives it. */
const LAYER_NAME_PREFIX = 'Layer'
/** Mirrors `apps/editor/src/constants/index.ts`'s `SPRITE_EDITOR_LAYER.DEFAULT_OPACITY`. */
const DEFAULT_LAYER_OPACITY = 100
/** Mirrors `apps/editor/src/constants/index.ts`'s `SPRITE_EDITOR_CANVAS.DEFAULT_WIDTH`/`DEFAULT_HEIGHT` — used only by `importDocument`'s last-resort empty-document fallback (a payload too corrupted for even `repairDocumentPayload` to recover anything from — no frames at all, or a non-positive canvas size). */
const FALLBACK_CANVAS_SIZE = 32
const CHANNELS = 4
const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

/**
 * One-shot id-seed override — same contract as `apps/editor/src/lib/core/
 * ts-core.ts`'s `setIdSeed`: consumed by exactly the NEXT `WasmPixelCore`
 * construction or `importDocument` call, then cleared. Deterministic tests
 * that want the TS and Wasm cores to mint IDENTICAL ids call BOTH this
 * function AND `ts-core.ts`'s `setIdSeed` with the same prefix before
 * constructing each core — the two modules have no shared state (different
 * packages), by design (see `document-types.ts`'s module doc).
 */
let idSeedOverride: string | null = null
export function setIdSeed(prefix: string): void {
  idSeedOverride = prefix
}

function randomIdSeed(): string {
  return crypto.randomUUID().slice(0, 8)
}

/** Mirrors `ts-core.ts`'s `highestIdSuffix` exactly — see that function's doc. */
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

interface EncodedDoc {
  readonly docMeta: Uint32Array
  readonly layerOpacity: Float64Array
  readonly layerNameLens: Uint32Array
  readonly layerNamesBytes: Uint8Array
  readonly pixels: Uint8Array
}

function concatLayerBytes(buffers: ReadonlyArray<Uint8Array | Uint8ClampedArray>): Uint8Array {
  const total = buffers.reduce((sum, b) => sum + b.byteLength, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const b of buffers) {
    out.set(b, offset)
    offset += b.byteLength
  }
  return out
}

/**
 * Fix-agent 7g (item 2, WARNING #3): encodes `names` as the length-prefixed
 * wire format `Document::decode_names` (`../src/document.rs`) expects — a
 * `u32` UTF-8 byte length per name, paired with the concatenated UTF-8 bytes
 * of every name, NO separator character. Replaces the old `names.join('\u0000')`
 * encoding, which silently corrupted every name reported AFTER one
 * containing a literal NUL character (confirmed via judgment-day's
 * `nul.jb.test.ts` repro — `"x\u0000y".split('\u0000')` desyncs the whole
 * array). A length-prefixed scheme has no separator to collide with, so a
 * name can contain ANY Unicode scalar value, including NUL, safely.
 */
function encodeNames(names: ReadonlyArray<string>): { readonly lens: Uint32Array; readonly bytes: Uint8Array } {
  const encoded = names.map((n) => textEncoder.encode(n))
  return { lens: Uint32Array.from(encoded.map((b) => b.length)), bytes: concatLayerBytes(encoded) }
}

/** Inverse of {@link encodeNames} — decodes `meta_layer_name_lens()`/`meta_layer_names_bytes()`'s length-prefixed pair back into an array of names, in cursor order. */
function decodeNames(lens: Uint32Array, bytes: Uint8Array): string[] {
  const names: string[] = []
  let offset = 0
  for (const len of lens) {
    names.push(textDecoder.decode(bytes.subarray(offset, offset + len)))
    offset += len
  }
  return names
}

/** Encodes a live `DocSnapshot` into `Document::from_payload`'s wire format — see that function's doc (`../src/document.rs`) for the exact `docMeta` layout this must match field-for-field. */
function encodeDocSnapshot(doc: DocSnapshot): EncodedDoc {
  const frames = doc.timeline.frames
  const frameCount = frames.length
  const selected = doc.timeline.selectedFrameIndices
  const durations = frames.map((f) => f.durationMs)
  const activeLayerIndex = frames.map((f) => Math.max(0, f.layers.findIndex((l) => l.id === f.activeLayerId)))
  const layerCounts = frames.map((f) => f.layers.length)
  const visible: number[] = []
  const locked: number[] = []
  const opacity: number[] = []
  const names: string[] = []
  const layerBuffers: Uint8ClampedArray[] = []
  for (const f of frames) {
    for (const l of f.layers) {
      visible.push(l.visible ? 1 : 0)
      locked.push(l.locked ? 1 : 0)
      opacity.push(l.opacity)
      names.push(l.name)
      layerBuffers.push(l.pixels.data)
    }
  }
  const docMeta = Uint32Array.from([
    doc.canvasWidth,
    doc.canvasHeight,
    doc.timeline.fps,
    doc.timeline.loop ? 1 : 0,
    doc.timeline.isPlaying ? 1 : 0,
    doc.timeline.currentFrameIndex,
    frameCount,
    selected.length,
    ...selected,
    ...durations,
    ...activeLayerIndex,
    ...layerCounts,
    ...visible,
    ...locked,
  ])
  const { lens: layerNameLens, bytes: layerNamesBytes } = encodeNames(names)
  return { docMeta, layerOpacity: Float64Array.from(opacity), layerNameLens, layerNamesBytes, pixels: concatLayerBytes(layerBuffers) }
}

/**
 * Fix-agent 7g (item 2): mirrors `ts-core.ts`'s `payloadToDoc` repair pass
 * EXACTLY — byte-length-mismatched layers are dropped (a frame left with
 * zero valid layers gets ONE synthesized blank fallback layer instead of
 * rejecting the whole import), duplicate layer/frame ids (anywhere in the
 * document — the pixel cache is keyed GLOBALLY by layer id, never scoped to
 * a frame, same reason `payloadToDoc`'s own doc gives) are reassigned a
 * fresh id (first occurrence keeps its original), and a missing/undefined
 * `frameMs[i]` falls back to the default frame duration. Called from
 * `importDocument` BEFORE `encodeDocumentPayload`, so the wire-format
 * encoder below always receives an already-well-formed payload — `null`
 * ONLY for the same genuinely-unrecoverable top-level shape `payloadToDoc`
 * also gives up on outright (no frames array, an empty frames array, or a
 * non-positive canvas size); `importDocument` still falls back to a
 * brand-new empty document in that one case.
 */
function isValidLayerPayload(l: DocumentLayerPayload, w: number, h: number): boolean {
  return l.data.byteLength === w * h * CHANNELS
}

function createFallbackLayer(w: number, h: number, id: LayerId): DocumentLayerPayload {
  return { id, name: `${LAYER_NAME_PREFIX} 1`, visible: true, locked: false, opacity: DEFAULT_LAYER_OPACITY, data: new Uint8Array(w * h * CHANNELS) }
}

function repairDocumentPayload(payload: DocumentPayload, idSeed: string): DocumentPayload | null {
  if (!payload || payload.w <= 0 || payload.h <= 0 || !Array.isArray(payload.frames) || payload.frames.length === 0) return null
  let minted = 0
  const mintId = (kind: 'f' | 'l'): string => {
    minted += 1
    return `${idSeed}-repair-${kind}${minted}`
  }
  const seenFrameIds = new Set<FrameId>()
  const seenLayerIds = new Set<LayerId>()
  const frames: DocumentFramePayload[] = payload.frames.map((f) => {
    const validLayers = f.layers.filter((l) => isValidLayerPayload(l, payload.w, payload.h))
    if (validLayers.length < f.layers.length) {
      console.error(
        `[pixelforge-core] WasmPixelCore.importDocument: dropped ${f.layers.length - validLayers.length} corrupted layer(s) in frame "${f.id}" (byte length mismatch for ${payload.w}x${payload.h})`
      )
    }
    let layers = validLayers.length > 0 ? validLayers : [createFallbackLayer(payload.w, payload.h, mintId('l'))]
    layers = layers.map((l) => {
      if (!seenLayerIds.has(l.id)) {
        seenLayerIds.add(l.id)
        return l
      }
      console.error(`[pixelforge-core] WasmPixelCore.importDocument: duplicate layer id "${l.id}" in frame "${f.id}" — assigning a fresh id`)
      const fresh = { ...l, id: mintId('l') }
      seenLayerIds.add(fresh.id)
      return fresh
    })
    let frameId = f.id
    if (seenFrameIds.has(frameId)) {
      console.error(`[pixelforge-core] WasmPixelCore.importDocument: duplicate frame id "${frameId}" — assigning a fresh id`)
      frameId = mintId('f')
    }
    seenFrameIds.add(frameId)
    const activeLayerId = layers.some((l) => l.id === f.activeLayerId) ? f.activeLayerId : layers[0].id
    return { id: frameId, activeLayerId, layers }
  })
  return {
    schemaVersion: payload.schemaVersion,
    w: payload.w,
    h: payload.h,
    // `payload.frameMs` itself may be entirely missing/`undefined` on a
    // malformed draft (not just shorter than `frames`) — `?? []` before
    // indexing so this never throws (indexing `undefined` would).
    frameMs: payload.frames.map((_, i) => (payload.frameMs ?? [])[i] ?? DEFAULT_FRAME_DURATION_MS),
    frames,
  }
}

/**
 * Encodes an (already `repairDocumentPayload`-repaired) `DocumentPayload`
 * the same way `encodeDocSnapshot` does (`importDocument`'s input shape —
 * NOT a `DocSnapshot`, it has no fps/loop/isPlaying/currentFrameIndex at
 * all). The per-layer byte-length/empty-frame checks below are now a
 * defensive double-check (repair already guarantees well-formedness, so
 * they should never actually trigger for a payload routed through
 * `repairDocumentPayload` first) rather than the primary validation gate.
 */
function encodeDocumentPayload(payload: DocumentPayload): EncodedDoc | null {
  if (!payload || payload.w <= 0 || payload.h <= 0 || !Array.isArray(payload.frames) || payload.frames.length === 0) return null
  const byteLen = payload.w * payload.h * 4
  for (const f of payload.frames) {
    if (f.layers.length === 0) return null
    for (const l of f.layers) if (l.data.byteLength !== byteLen) return null
  }
  const frameCount = payload.frames.length
  const activeLayerIndex = payload.frames.map((f) => Math.max(0, f.layers.findIndex((l) => l.id === f.activeLayerId)))
  const layerCounts = payload.frames.map((f) => f.layers.length)
  const visible: number[] = []
  const locked: number[] = []
  const opacity: number[] = []
  const names: string[] = []
  const layerBuffers: Uint8Array[] = []
  for (const f of payload.frames) {
    for (const l of f.layers) {
      visible.push(l.visible ? 1 : 0)
      locked.push(l.locked ? 1 : 0)
      opacity.push(l.opacity)
      names.push(l.name)
      layerBuffers.push(l.data)
    }
  }
  // payloadToDoc always resets fps/loop/isPlaying/currentFrameIndex/selectedFrameIndices
  // to defaults — DocumentPayload carries none of these fields.
  const docMeta = Uint32Array.from([
    payload.w,
    payload.h,
    DEFAULT_FPS,
    1,
    0,
    0,
    frameCount,
    1,
    0,
    ...payload.frameMs,
    ...activeLayerIndex,
    ...layerCounts,
    ...visible,
    ...locked,
  ])
  const { lens: layerNameLens, bytes: layerNamesBytes } = encodeNames(names)
  return { docMeta, layerOpacity: Float64Array.from(opacity), layerNameLens, layerNamesBytes, pixels: concatLayerBytes(layerBuffers) }
}

/** Mirrors `ts-core.ts`'s `clampRectToBuffer` — used ONLY by `region.clear`, which CLAMPS a negative/oversized rect rather than rejecting it (unlike `selection.commit`, which rejects — see this file's `dispatch` doc on that case). A `u32` Wasm argument cannot represent a negative coordinate without wraparound, so this half of the clamp (resolving a possibly-negative `rect.x`/`rect.y` against the ORIGINAL, unclamped far edge) must happen here, in JS, before anything crosses the boundary. */
function clampRectToCanvas(rect: Rect, canvasW: number, canvasH: number): Rect | null {
  const x0 = Math.max(0, rect.x)
  const y0 = Math.max(0, rect.y)
  const x1 = Math.min(canvasW, rect.x + rect.w)
  const y1 = Math.min(canvasH, rect.y + rect.h)
  if (x1 <= x0 || y1 <= y0) return null
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
}

interface EncodedPaste {
  readonly layerCounts: Uint32Array
  readonly durations: Uint32Array
  readonly visible: Uint32Array
  readonly locked: Uint32Array
  readonly opacity: Float64Array
  readonly nameLens: Uint32Array
  readonly namesBytes: Uint8Array
  readonly pixels: Uint8Array
}

/** `null` on the SAME "invalid" shape `ts-core.ts`'s `frame.paste` case rejects (zero layers in a frame, or a layer whose declared/actual size doesn't match the CURRENT canvas) — `dispatch` still calls into Wasm with a degenerate (empty) payload in that case, so an open stroke is still force-committed (see this file's `dispatch` doc). */
function encodeSerializedFrames(frames: ReadonlyArray<SerializedFrame>, canvasW: number, canvasH: number): EncodedPaste | null {
  if (frames.length === 0) return null
  const byteLen = canvasW * canvasH * 4
  for (const f of frames) {
    if (f.layers.length === 0) return null
    for (const l of f.layers) if (l.w !== canvasW || l.h !== canvasH || l.data.byteLength !== byteLen) return null
  }
  const layerCounts = frames.map((f) => f.layers.length)
  const durations = frames.map((f) => f.durationMs)
  const visible: number[] = []
  const locked: number[] = []
  const opacity: number[] = []
  const names: string[] = []
  const layerBuffers: Uint8Array[] = []
  for (const f of frames) {
    for (const l of f.layers) {
      visible.push(l.visible ? 1 : 0)
      locked.push(l.locked ? 1 : 0)
      opacity.push(l.opacity)
      names.push(l.name)
      layerBuffers.push(l.data)
    }
  }
  const { lens: nameLens, bytes: namesBytes } = encodeNames(names)
  return {
    layerCounts: Uint32Array.from(layerCounts),
    durations: Uint32Array.from(durations),
    visible: Uint32Array.from(visible),
    locked: Uint32Array.from(locked),
    opacity: Float64Array.from(opacity),
    nameLens,
    namesBytes,
    pixels: concatLayerBytes(layerBuffers),
  }
}

interface DecodedMeta {
  readonly canvasWidth: number
  readonly canvasHeight: number
  readonly fps: number
  readonly loop: boolean
  readonly isPlaying: boolean
  readonly currentFrameIndex: number
  readonly selectedFrameIndices: number[]
  readonly frames: ReadonlyArray<{
    readonly id: FrameId
    readonly activeLayerId: LayerId
    readonly durationMs: number
    readonly layers: ReadonlyArray<{ readonly id: LayerId; readonly name: string; readonly visible: boolean; readonly locked: boolean; readonly opacity: number }>
  }>
}

export class WasmPixelCore implements PixelCore {
  readonly impl = 'wasm' as const
  private doc: WasmDocumentHandle
  private idSeed: string
  private frameIdCounter: number
  private layerIdCounter: number
  private readonly frameIdByHandle = new Map<number, FrameId>()
  private readonly frameHandleById = new Map<FrameId, number>()
  private readonly layerIdByHandle = new Map<number, LayerId>()
  private readonly layerHandleById = new Map<LayerId, number>()

  constructor(
    private readonly mod: WasmExports,
    doc: DocSnapshot
  ) {
    this.idSeed = idSeedOverride ?? randomIdSeed()
    idSeedOverride = null
    const frameIds = doc.timeline.frames.map((f) => f.id)
    const layerIds = doc.timeline.frames.flatMap((f) => f.layers.map((l) => l.id))
    this.frameIdCounter = highestIdSuffix(frameIds, this.idSeed, 'f')
    this.layerIdCounter = highestIdSuffix(layerIds, this.idSeed, 'l')

    const encoded = encodeDocSnapshot(doc)
    const built = mod.WasmDocument.from_payload(encoded.docMeta, encoded.layerOpacity, encoded.layerNameLens, encoded.layerNamesBytes, encoded.pixels)
    if (!built) throw new Error('WasmPixelCore: the provided DocSnapshot failed to encode for the Wasm boundary (this should never happen for a document produced by this codebase)')
    this.doc = built
    this.registerFrames(doc.timeline.frames.map((f) => ({ id: f.id, layerIds: f.layers.map((l) => l.id) })))
  }

  private registerFrames(frames: ReadonlyArray<{ id: FrameId; layerIds: ReadonlyArray<LayerId> }>): void {
    let fh = 0
    let lh = 0
    for (const f of frames) {
      fh += 1
      this.frameIdByHandle.set(fh, f.id)
      this.frameHandleById.set(f.id, fh)
      for (const layerId of f.layerIds) {
        lh += 1
        this.layerIdByHandle.set(lh, layerId)
        this.layerHandleById.set(layerId, lh)
      }
    }
  }

  private layerHandle(id: LayerId): number {
    return this.layerHandleById.get(id) ?? 0 // unknown id -> sentinel handle 0 (never assigned) -> a safe no-op on the Rust side
  }

  private resolveOrMintLayerId(handle: number): LayerId {
    const existing = this.layerIdByHandle.get(handle)
    if (existing !== undefined) return existing
    this.layerIdCounter += 1
    const id = `${this.idSeed}-l${this.layerIdCounter}`
    this.layerIdByHandle.set(handle, id)
    this.layerHandleById.set(id, handle)
    return id
  }

  private resolveOrMintFrameId(handle: number): FrameId {
    const existing = this.frameIdByHandle.get(handle)
    if (existing !== undefined) return existing
    this.frameIdCounter += 1
    const id = `${this.idSeed}-f${this.frameIdCounter}`
    this.frameIdByHandle.set(handle, id)
    this.frameHandleById.set(id, handle)
    return id
  }

  /**
   * Decodes the flat `Vec<u32>` every mutating `WasmDocument` method returns
   * (layout documented in `../src/bindings.rs`'s module doc) into a full
   * `DispatchResult`, translating every frame/layer HANDLE into its STRING
   * id. New ids are minted here, lazily, the first time a previously-unseen
   * handle appears in `dirty` — see `document.rs`'s module doc for why this
   * is a COMPLETE detection rule (every new frame/layer is always reported
   * dirty immediately), and why layer ids are minted before their owning
   * frame's id within each contiguous same-frame run (matching `ts-core.ts`'s
   * actual minting order: `nextLayerId` always runs before `nextFrameId`).
   * `evicted` handles are ALWAYS pre-existing — never minted here.
   */
  private decode(raw: Uint32Array): DispatchResult {
    let i = 0
    const changed = raw[i++] !== 0
    const contentChanged = raw[i++] !== 0
    const structureChanged = raw[i++] !== 0
    const historyChanged = raw[i++] !== 0
    const canUndo = raw[i++] !== 0
    const canRedo = raw[i++] !== 0
    const strokeOpen = raw[i++] !== 0
    const revision = raw[i++]
    const contentRevision = raw[i++]
    const dirtyCount = raw[i++]
    const evictedCount = raw[i++]
    const layerRevCount = raw[i++]

    const rawDirty: Array<{ frameHandle: number; layerHandle: number; rect: Rect }> = []
    for (let k = 0; k < dirtyCount; k++) {
      const frameHandle = raw[i++]
      const layerHandle = raw[i++]
      const x = raw[i++]
      const y = raw[i++]
      const w = raw[i++]
      const h = raw[i++]
      rawDirty.push({ frameHandle, layerHandle, rect: { x, y, w, h } })
    }

    const dirty: DirtyRect[] = []
    let idx = 0
    while (idx < rawDirty.length) {
      const frameHandle = rawDirty[idx].frameHandle
      let end = idx
      while (end < rawDirty.length && rawDirty[end].frameHandle === frameHandle) end++
      // Mint every layer in this contiguous same-frame run FIRST, in order...
      const layerIds: LayerId[] = []
      for (let k = idx; k < end; k++) layerIds.push(this.resolveOrMintLayerId(rawDirty[k].layerHandle))
      // ...THEN the frame id, matching `nextLayerId` always preceding `nextFrameId` in `ts-core.ts`.
      const frameId = this.resolveOrMintFrameId(frameHandle)
      for (let k = idx; k < end; k++) dirty.push({ frameId, layerId: layerIds[k - idx], rect: rawDirty[k].rect })
      idx = end
    }

    const evicted: LayerRef[] = []
    for (let k = 0; k < evictedCount; k++) {
      const frameHandle = raw[i++]
      const layerHandle = raw[i++]
      evicted.push({ frameId: this.frameIdByHandle.get(frameHandle) ?? '', layerId: this.layerIdByHandle.get(layerHandle) ?? '' })
    }

    const layerRevisions: Record<string, number> = {}
    for (let k = 0; k < layerRevCount; k++) {
      const layerHandle = raw[i++]
      const rev = raw[i++]
      const layerId = this.layerIdByHandle.get(layerHandle)
      if (layerId !== undefined) layerRevisions[layerId] = rev
    }

    return { changed, contentChanged, structureChanged, historyChanged, canUndo, canRedo, strokeOpen, revision, contentRevision, dirty, evicted, layerRevisions }
  }

  dispatch(cmd: Command): DispatchResult {
    switch (cmd.type) {
      case 'stroke.begin':
        return this.decode(this.doc.stroke_begin(this.layerHandle(cmd.layerId)))
      case 'stroke.points':
        return this.decode(this.doc.stroke_points(cmd.points, cmd.rgba))
      case 'stroke.end':
        return this.decode(this.doc.stroke_end(cmd.label))
      case 'fill':
        return this.decode(this.doc.fill(this.layerHandle(cmd.layerId), cmd.x, cmd.y, cmd.rgba, cmd.label ?? ''))
      case 'region.clear': {
        const meta = this.doc.meta_doc()
        const clamped = clampRectToCanvas(cmd.rect, meta[0], meta[1]) ?? { x: 0, y: 0, w: 0, h: 0 }
        return this.decode(this.doc.region_clear(this.layerHandle(cmd.layerId), clamped.x, clamped.y, clamped.w, clamped.h))
      }
      case 'selection.commit': {
        const bytes = new Uint8Array(cmd.pixels.buffer, cmd.pixels.byteOffset, cmd.pixels.byteLength)
        return this.decode(this.doc.selection_commit(this.layerHandle(cmd.layerId), cmd.at.x, cmd.at.y, cmd.at.w, cmd.at.h, bytes))
      }
      case 'layer.add':
        return this.decode(this.doc.layer_add())
      case 'layer.remove':
        return this.decode(this.doc.layer_remove(this.layerHandle(cmd.layerId)))
      case 'layer.meta':
        return this.decode(this.doc.layer_meta(this.layerHandle(cmd.layerId), cmd.patch.name, cmd.patch.visible, cmd.patch.locked, cmd.patch.opacity))
      case 'layer.reorder':
        // Fix-agent 7g (item 3): reject a fractional `from`/`to` on THIS side
        // of the boundary — a `u32` wasm-bindgen argument TRUNCATES a
        // fractional JS number (e.g. `1.5` arrives as `1`), which would make
        // an otherwise-in-range reorder actually RUN using the truncated
        // index instead of staying a no-op (the TS reference's own fix for
        // this exact case — see `ts-core.ts`'s `layer.reorder` case —
        // rejects it outright). `noop()` reports "nothing changed" without
        // ever letting wasm-bindgen's coercion see the fractional value.
        return Number.isInteger(cmd.from) && Number.isInteger(cmd.to) ? this.decode(this.doc.layer_reorder(cmd.from, cmd.to)) : this.decode(this.doc.noop())
      case 'layer.setActive':
        return this.decode(this.doc.layer_set_active(this.layerHandle(cmd.layerId)))
      case 'frame.select':
        return Number.isInteger(cmd.index) ? this.decode(this.doc.frame_select(cmd.index)) : this.decode(this.doc.noop())
      case 'frame.add':
        return this.decode(this.doc.frame_add())
      case 'frame.remove':
        return Number.isInteger(cmd.index) ? this.decode(this.doc.frame_remove(cmd.index)) : this.decode(this.doc.noop())
      case 'doc.replace': {
        const meta = this.doc.meta_doc()
        const sizeMismatch =
          cmd.frames.length === 0 ||
          cmd.frames.some(
            (f: { pixels: PixelBuffer }) => f.pixels.w !== cmd.canvasWidth || f.pixels.h !== cmd.canvasHeight || f.pixels.data.byteLength !== cmd.canvasWidth * cmd.canvasHeight * 4
          )
        const pixels = sizeMismatch ? new Uint8Array(0) : concatLayerBytes(cmd.frames.map((f: { pixels: PixelBuffer }) => f.pixels.data))
        const frameCount = sizeMismatch ? 0 : cmd.frames.length
        void meta
        return this.decode(this.doc.doc_replace(cmd.canvasWidth, cmd.canvasHeight, frameCount, cmd.frameDurationMs, pixels, cmd.label))
      }
      case 'frame.paste': {
        // Fix-agent 7g (item 3): a fractional `at` (e.g. `1.5`) used to
        // truncate silently at the wasm-bindgen `u32` boundary — unlike
        // `ts-core.ts`'s reference (which now rejects it outright, see that
        // case's doc), this would have let the paste actually run at the
        // truncated index. Reject on THIS side instead, for parity.
        if (!Number.isInteger(cmd.at)) return this.decode(this.doc.noop())
        const meta = this.doc.meta_doc()
        const encoded = encodeSerializedFrames(cmd.frames, meta[0], meta[1])
        if (!encoded) {
          return this.decode(
            this.doc.frame_paste(cmd.at, new Uint32Array(0), new Uint32Array(0), new Uint32Array(0), new Uint32Array(0), new Float64Array(0), new Uint32Array(0), new Uint8Array(0), new Uint8Array(0))
          )
        }
        return this.decode(
          this.doc.frame_paste(cmd.at, encoded.layerCounts, encoded.durations, encoded.visible, encoded.locked, encoded.opacity, encoded.nameLens, encoded.namesBytes, encoded.pixels)
        )
      }
      case 'undo':
        return this.decode(this.doc.undo())
      case 'redo':
        return this.decode(this.doc.redo())
      case 'timeline.setFps':
        // Fix-agent 7g (item 3): round BEFORE crossing into the `u32`
        // parameter — matches `ts-core.ts`'s reference, which now also
        // rounds before clamping (see that case's doc) instead of letting
        // Rust's `u32` coercion silently truncate a fractional fps.
        return this.decode(this.doc.timeline_set_fps(Math.round(cmd.fps)))
      case 'timeline.toggleLoop':
        return this.decode(this.doc.timeline_toggle_loop())
      case 'timeline.setFrameSelection':
        // Fix-agent 7g (item 3): drop non-integer entries BEFORE building the
        // `Uint32Array` — `Uint32Array.from` silently truncates a fractional
        // number (the same coercion-hides-a-bad-input class every other fix
        // in this pass addresses), where `ts-core.ts`'s reference explicitly
        // filters them out (see that case's `Number.isInteger` guard).
        return this.decode(this.doc.timeline_set_frame_selection(Uint32Array.from(cmd.indices.filter((i) => Number.isInteger(i)))))
      case 'timeline.togglePlayback':
        return this.decode(this.doc.timeline_toggle_playback())
      default: {
        const _exhaustive: never = cmd
        throw new Error(`WasmPixelCore.dispatch: unhandled command ${JSON.stringify(_exhaustive)}`)
      }
    }
  }

  undo(): DispatchResult {
    return this.dispatch({ type: 'undo' })
  }

  redo(): DispatchResult {
    return this.dispatch({ type: 'redo' })
  }

  readLayer(frameId: string, layerId: string): Uint8ClampedArray {
    const fh = this.frameHandleById.get(frameId)
    const lh = this.layerHandleById.get(layerId)
    if (fh === undefined || lh === undefined) return new Uint8ClampedArray(0)
    const bytes = this.doc.read_layer(fh, lh)
    return new Uint8ClampedArray(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  }

  private readMeta(): DecodedMeta {
    const raw = this.doc.meta_doc()
    let i = 0
    const canvasWidth = raw[i++]
    const canvasHeight = raw[i++]
    const fps = raw[i++]
    const loop = raw[i++] !== 0
    const isPlaying = raw[i++] !== 0
    const currentFrameIndex = raw[i++]
    const frameCount = raw[i++]
    const selectedCount = raw[i++]
    const selectedFrameIndices: number[] = []
    for (let k = 0; k < selectedCount; k++) selectedFrameIndices.push(raw[i++])
    const durations: number[] = []
    for (let k = 0; k < frameCount; k++) durations.push(raw[i++])
    const frameHandles: number[] = []
    for (let k = 0; k < frameCount; k++) frameHandles.push(raw[i++])
    const activeLayerHandles: number[] = []
    for (let k = 0; k < frameCount; k++) activeLayerHandles.push(raw[i++])
    const layerCounts: number[] = []
    for (let k = 0; k < frameCount; k++) layerCounts.push(raw[i++])
    const totalLayers = layerCounts.reduce((a, b) => a + b, 0)
    const layerHandles: number[] = []
    for (let k = 0; k < totalLayers; k++) layerHandles.push(raw[i++])
    const visible: number[] = []
    for (let k = 0; k < totalLayers; k++) visible.push(raw[i++])
    const locked: number[] = []
    for (let k = 0; k < totalLayers; k++) locked.push(raw[i++])
    const opacity = this.doc.meta_layer_opacity()
    const names = totalLayers === 0 ? [] : decodeNames(this.doc.meta_layer_name_lens(), this.doc.meta_layer_names_bytes())

    const frames: DecodedMeta['frames'][number][] = []
    let cursor = 0
    for (let f = 0; f < frameCount; f++) {
      const lc = layerCounts[f]
      const frameId = this.frameIdByHandle.get(frameHandles[f])
      if (frameId === undefined) throw new Error(`WasmPixelCore.readMeta: unknown frame handle ${frameHandles[f]} (internal invariant violation)`)
      const layers = []
      for (let k = 0; k < lc; k++) {
        const handle = layerHandles[cursor]
        const layerId = this.layerIdByHandle.get(handle)
        if (layerId === undefined) throw new Error(`WasmPixelCore.readMeta: unknown layer handle ${handle} (internal invariant violation)`)
        layers.push({ id: layerId, name: names[cursor], visible: visible[cursor] !== 0, locked: locked[cursor] !== 0, opacity: opacity[cursor] })
        cursor++
      }
      const activeLayerId = this.layerIdByHandle.get(activeLayerHandles[f]) ?? layers[0]?.id ?? ''
      frames.push({ id: frameId, activeLayerId, durationMs: durations[f], layers })
    }
    return { canvasWidth, canvasHeight, fps, loop, isPlaying, currentFrameIndex, selectedFrameIndices, frames }
  }

  snapshot(): DocMetaSnapshot {
    const meta = this.readMeta()
    return {
      canvasWidth: meta.canvasWidth,
      canvasHeight: meta.canvasHeight,
      timeline: {
        currentFrameIndex: meta.currentFrameIndex,
        isPlaying: meta.isPlaying,
        fps: meta.fps,
        loop: meta.loop,
        selectedFrameIndices: meta.selectedFrameIndices,
        frames: meta.frames.map((f) => ({
          id: f.id,
          activeLayerId: f.activeLayerId,
          durationMs: f.durationMs,
          layers: f.layers.map((l) => ({ id: l.id, name: l.name, visible: l.visible, locked: l.locked, opacity: l.opacity })),
        })),
      },
    }
  }

  exportDocument(): DocumentPayload {
    const meta = this.readMeta()
    const pixels = this.doc.export_pixels()
    const byteLen = meta.canvasWidth * meta.canvasHeight * 4
    let offset = 0
    const frames: DocumentFramePayload[] = meta.frames.map((f) => ({
      id: f.id,
      activeLayerId: f.activeLayerId,
      layers: f.layers.map((l) => {
        const data = pixels.slice(offset, offset + byteLen)
        offset += byteLen
        return { id: l.id, name: l.name, visible: l.visible, locked: l.locked, opacity: l.opacity, data }
      }),
    }))
    return { schemaVersion: DOCUMENT_SCHEMA_VERSION, w: meta.canvasWidth, h: meta.canvasHeight, frameMs: meta.frames.map((f) => f.durationMs), frames }
  }

  importDocument(payload: DocumentPayload): void {
    // Phase 7f WARNING #6 (confirmed via judges' `mem.jb.test.ts`: 300
    // sequential `importDocument` calls on the SAME instance grew Wasm linear
    // memory by ~1MB each, linearly, with no sign of reclamation): replacing
    // `this.doc` below used to just drop the reference and hope
    // wasm-bindgen's auto-generated `FinalizationRegistry` collected the OLD
    // `WasmDocument`'s linear-memory allocation "eventually" — which is
    // correct for ONE long-lived document per `WasmPixelCore` (confirmed fine
    // by verify-report-phase-7), but wrong for THIS method's actual usage
    // pattern (replace the document on an otherwise long-lived core — every
    // "open file"/draft restore/corrupted-import recovery). `.free()` is
    // wasm-bindgen's synchronous, deterministic release of that instance's
    // Wasm-side memory — safe to call here because nothing else can still be
    // holding a reference to the OLD `this.doc` (this class is the only
    // owner), and every path below unconditionally reassigns `this.doc` to a
    // NEW instance before returning.
    this.doc.free()

    this.idSeed = idSeedOverride ?? randomIdSeed()
    idSeedOverride = null
    this.frameIdByHandle.clear()
    this.frameHandleById.clear()
    this.layerIdByHandle.clear()
    this.layerHandleById.clear()

    // Fix-agent 7g (item 2, WARNING #3/7.12): `repairDocumentPayload` runs
    // the SAME per-layer/per-id repair pass `ts-core.ts`'s `payloadToDoc`
    // does — dropping only the corrupted layer/frame, deduping ids, defaulting
    // a missing `frameMs` entry — BEFORE this payload is flattened into the
    // wire format. `encodeDocumentPayload`'s own validation (below) is now a
    // defensive double-check that should never actually trigger for a
    // `repaired` payload; it still falls through to the coarse empty-document
    // fallback if it somehow does, same safety net as before this fix. The
    // whole attempt is wrapped in try/catch — `payloadToDoc`'s OWN outer
    // try/catch is this method's reference for "never let a malformed/hostile
    // payload throw past this method", and `repairDocumentPayload`/
    // `encodeDocumentPayload` are plain data transforms with no Wasm calls of
    // their own, so any unexpected exception here (e.g. a shape this fix
    // didn't anticipate) is treated exactly like `repaired === null` — fall
    // through to the coarse empty-document fallback below, never escape.
    try {
      const repaired = repairDocumentPayload(payload, this.idSeed)
      const encoded = repaired && encodeDocumentPayload(repaired)
      const built = encoded && this.mod.WasmDocument.from_payload(encoded.docMeta, encoded.layerOpacity, encoded.layerNameLens, encoded.layerNamesBytes, encoded.pixels)
      if (built && repaired) {
        this.doc = built
        this.registerFrames(repaired.frames.map((f) => ({ id: f.id, layerIds: f.layers.map((l) => l.id) })))
        this.frameIdCounter = highestIdSuffix(
          repaired.frames.map((f) => f.id),
          this.idSeed,
          'f'
        )
        this.layerIdCounter = highestIdSuffix(
          repaired.frames.flatMap((f) => f.layers.map((l) => l.id)),
          this.idSeed,
          'l'
        )
        return
      }
    } catch (error) {
      console.error('[pixelforge-core] WasmPixelCore.importDocument: unexpected error repairing/encoding the payload — falling back to a new empty document.', error)
    }

    // Only reached for the SAME genuinely-unrecoverable top-level shape
    // `payloadToDoc` also gives up on outright (no frames array, an empty
    // frames array, or a non-positive canvas size), or an unexpected
    // exception caught above. Never throws, never corrupts: falls back to a
    // brand-new empty document, same shape `createEmptyDocSnapshot` builds.
    console.error('[pixelforge-core] WasmPixelCore.importDocument: payload failed validation — falling back to a new empty document.')
    this.doc = new this.mod.WasmDocument(FALLBACK_CANVAS_SIZE, FALLBACK_CANVAS_SIZE)
    const frameId = `${this.idSeed}-f1`
    const layerId = `${this.idSeed}-l1`
    this.frameIdByHandle.set(1, frameId)
    this.frameHandleById.set(frameId, 1)
    this.layerIdByHandle.set(1, layerId)
    this.layerHandleById.set(layerId, 1)
    this.frameIdCounter = 1
    this.layerIdCounter = 1
  }

  get canUndo(): boolean {
    return this.doc.can_undo()
  }

  get canRedo(): boolean {
    return this.doc.can_redo()
  }

  /**
   * Total bytes retained by the undo/redo stack right now — NOT part of the
   * `PixelCore` interface (the TS side has no equivalent on `TsPixelCore`'s
   * public surface either; its own history bytes are measured by reaching
   * into `CoreState.history` directly in `*.undo-memory.baseline.test.ts`).
   * Exposed here as an extra diagnostic method for the same kind of
   * measurement against `WasmPixelCore`.
   */
  historyBytes(): number {
    return this.doc.history_bytes()
  }

  /**
   * TEST-ONLY (phase 7f) passthrough to `WasmDocument.debug_force_trap` — see
   * that method's doc. Lets a JS-side test reproduce a REAL
   * `WebAssembly.RuntimeError` deterministically instead of relying on a
   * genuine OOM. Never called by production code.
   */
  debugForceTrap(): void {
    this.doc.debug_force_trap()
  }

  /**
   * Fix-agent 7g (item 5): explicit, deterministic release of the underlying
   * `WasmDocument`'s Wasm-linear-memory allocation — NOT part of the
   * `PixelCore` interface (`TsPixelCore` has nothing to release; a Wasm core
   * is the only implementation that owns a foreign allocation at all).
   * `importDocument` already does this internally on every document REPLACE
   * (phase 7f WARNING #6); this covers the one case that didn't: discarding
   * a `WasmPixelCore` instance ENTIRELY (never calling anything else on it
   * again) without waiting on GC + wasm-bindgen's `FinalizationRegistry`,
   * which verify-report-phase-7 confirmed is fine for the app's actual
   * "one long-lived core per session" pattern but is not deterministic —
   * useful for tests and any future caller that creates/discards many cores
   * (e.g. a multi-document workflow). Calling ANY other method on this
   * instance after `dispose()` throws (the underlying Wasm object is freed);
   * this is intentionally a terminal operation, not a reset.
   */
  dispose(): void {
    this.doc.free()
  }
}
