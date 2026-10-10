/**
 * Local-draft persistence contract (phase 1, D8/D12). `DocumentPayload` is
 * plain, structured-clone-safe data — no class instances, no `PixelBuffer`
 * (which is also structured-clone safe, but kept separate: the payload
 * shape is the durable on-disk contract, independent of the in-memory
 * `Layer`/`AnimationFrame` shape the store happens to use today).
 *
 * Deviation from design.md's abbreviated `DocumentPayload` sketch: each
 * frame keeps its own `activeLayerId`, and `frameMs` stays a parallel array
 * (one entry per frame, same order as `frames`) rather than embedding
 * duration per frame object, matching the design doc literally. Dropping
 * `activeLayerId` entirely (as the sketch implied) would lose information
 * needed to restore `Timeline` faithfully — "Draft restored after reload"
 * requires a byte-identical restore of frames, not just pixels.
 */

export type DocumentId = string

export interface DocumentLayerPayload {
  readonly id: string
  readonly name: string
  readonly visible: boolean
  readonly locked: boolean
  readonly opacity: number
  /** Native binary, no base64 (D13) — structured-clone carries it as-is. */
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
  /** Parallel to `frames`: `frameMs[i]` is `frames[i]`'s duration in ms. */
  readonly frameMs: number[]
  readonly frames: DocumentFramePayload[]
}

export interface StoredDocument {
  readonly id: DocumentId
  /** For future conflict handling (Supabase sync, out of scope here). */
  readonly revision: number
  readonly updatedAt: number
  readonly payload: DocumentPayload
}

/**
 * Async on purpose: a Supabase adapter is a drop-in behind the same port
 * (D12 — local-first now, remote sync is a later change).
 */
export interface DocumentRepository {
  load(id: DocumentId): Promise<StoredDocument | null>
  save(doc: StoredDocument): Promise<void>
  remove(id: DocumentId): Promise<void>
}
