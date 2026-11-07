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

import type { AIGeneration } from './ai-generation'

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
  /** Removes every stored document (the draft and every per-asset document). */
  clear(): Promise<void>
}

/** ADR 0015: the flattened PNG of a sprite document, as its Assets item stores it. */
export interface SpritePreview {
  readonly base64: string
  readonly width: number
  readonly height: number
}

/** A new editor-made sprite asset, as `useAssetsStore.addDrawing` takes it. */
export type NewSpriteDrawing = Omit<AIGeneration, 'id' | 'timestamp' | 'kind'>

/**
 * The slice of `useAssetsStore` the document layer needs (ADR 0015). The
 * store itself satisfies it, so the persistence controller and the draft
 * migration stay testable without React and never import the store module.
 */
export interface DocumentAssetsState {
  readonly generations: readonly AIGeneration[]
  readonly openAssetId: string | null
  addDrawing: (drawing: NewSpriteDrawing) => AIGeneration
  updateDrawingContent: (id: string, content: SpritePreview) => void
  removeGeneration: (id: string) => void
  setOpenAssetId: (id: string | null) => void
}

export interface DocumentAssetsApi {
  getState: () => DocumentAssetsState
  /** Same signature as zustand's `subscribe`: the listener gets the next and the previous state. */
  subscribe: (listener: (state: DocumentAssetsState, previous: DocumentAssetsState) => void) => () => void
}
