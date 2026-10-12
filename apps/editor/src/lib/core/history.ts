import type { AnimationFrame, Layer, Timeline } from '@/types'
import type { Rect } from '@/types'
import { SPRITE_EDITOR_HISTORY } from '@/constants'

/**
 * Dirty-rect undo history (phase 2, design D4). A PATCH entry retains only
 * the before/after bytes of the rect a command actually touched, not the
 * whole document.
 *
 * Phase 2c (judgment-day round 1): every structural AND every pixel-patch
 * command became undoable, but structural commands (layer/frame CRUD) kept
 * reusing a whole-timeline before/after `StructuralDocSnapshot` — a single
 * visibility toggle on a 16-frame/4-layer document cost tens of MB (the
 * ENTIRE document, twice), because there is no bounded "rect" for "a layer's
 * metadata changed". That is the bug judgment-day round 2 flags.
 *
 * Phase 2c (judgment-day round 2, this change): the generic `'structural'`
 * kind is replaced with one small, purpose-built entry per structural
 * command — `layer.add`/`layer.remove` keep only the ONE layer they
 * added/removed (not the whole document), `layer.meta` keeps only the
 * before/after scalar metadata (no pixels at all), `layer.reorder` keeps
 * only the from/to indices, and `frame.add`/`frame.remove`/`frame.paste`
 * keep only the frame(s) they actually touched. `doc.replace` is the one
 * deliberate exception — swapping the ENTIRE document's content has no
 * smaller representation, so it keeps the full before/after
 * `StructuralDocSnapshot` (counted once toward the byte budget, same as any
 * other entry — see `entryBytes`). This is an intentional, documented
 * deviation from "every entry is a small record": a whole-document replace
 * cannot be made small without losing the ability to undo it.
 *
 * None of these entries carry `currentFrameIndex`/`selectedFrameIndices`
 * snapshots any more either — undo/redo "focus" (which frame/layer becomes
 * current) is resolved dynamically by `ts-core.ts`'s `focusStructural`
 * against the entry's own affected frame/layer id, falling back to the
 * user's CURRENT selection (if still valid) before falling back to a
 * nearest-valid index (design.md's "Command Undoability — undo/redo focus"
 * rule, judgment-day round 2 decision). Storing a stale recorded index was
 * exactly the bug that rule replaces.
 */

export interface HistoryPatch {
  readonly layerId: string
  readonly rect: Rect
  readonly before: Uint8Array
  readonly after: Uint8Array
}

/** Full-document snapshot — ONLY used by the `doc.replace` entry (see module doc). */
export interface StructuralDocSnapshot {
  readonly canvasWidth: number
  readonly canvasHeight: number
  readonly timeline: Timeline
}

/**
 * One cut strip retained by a `doc.resize` entry (ADR 0008) — only the
 * pixels a shrink actually removed, addressed by stable `(frameId,
 * layerId)` and a rect in the OLD (`from`) coordinate space. Mirrors
 * `history.rs`'s `ResizeStrip`.
 */
export interface ResizeStrip {
  readonly frameId: string
  readonly layerId: string
  readonly rect: Rect
  readonly bytes: Uint8Array
}

export interface LayerMetaSnapshot {
  readonly name: string
  readonly visible: boolean
  readonly locked: boolean
  readonly opacity: number
}

export type HistoryEntry =
  | {
      readonly kind: 'patch'
      readonly label: string
      /** Stable frame id the patch targets — resolved by id, never by array index (phase 2c round 1 fix). */
      readonly frameId: string
      readonly activeLayerId: string
      readonly patches: readonly HistoryPatch[]
    }
  | {
      readonly kind: 'layer.add'
      readonly label: string
      readonly frameId: string
      readonly layer: Layer
      readonly index: number
    }
  | {
      readonly kind: 'layer.remove'
      readonly label: string
      readonly frameId: string
      readonly layer: Layer
      readonly index: number
    }
  | {
      readonly kind: 'layer.meta'
      readonly label: string
      readonly frameId: string
      readonly layerId: string
      readonly before: LayerMetaSnapshot
      readonly after: LayerMetaSnapshot
    }
  | {
      readonly kind: 'layer.reorder'
      readonly label: string
      readonly frameId: string
      readonly layerId: string
      readonly from: number
      readonly to: number
    }
  | {
      readonly kind: 'frame.add'
      readonly label: string
      readonly frame: AnimationFrame
      readonly index: number
    }
  | {
      readonly kind: 'frame.remove'
      readonly label: string
      readonly frame: AnimationFrame
      readonly index: number
    }
  | {
      readonly kind: 'frame.paste'
      readonly label: string
      readonly frames: readonly AnimationFrame[]
      readonly at: number
    }
  | {
      readonly kind: 'doc.replace'
      readonly label: string
      readonly before: StructuralDocSnapshot
      readonly after: StructuralDocSnapshot
    }
  | {
      /**
       * ADR 0008: a lossless canvas resize. Every layer is mutated IN PLACE
       * (same frame/layer ids — unlike `doc.replace`), so this entry stores
       * only the before/after SIZE plus the strips a shrink cut away, never
       * a full document snapshot. Growing a canvas produces `strips: []`
       * (0 bytes toward the undo budget).
       */
      readonly kind: 'doc.resize'
      readonly label: string
      readonly fromWidth: number
      readonly fromHeight: number
      readonly toWidth: number
      readonly toHeight: number
      readonly strips: readonly ResizeStrip[]
    }

export interface History {
  readonly entries: readonly HistoryEntry[]
  /** Index of the last APPLIED entry; -1 means nothing has been applied yet. */
  readonly cursor: number
}

export const HISTORY_MAX_ENTRIES = SPRITE_EDITOR_HISTORY.MAX_ENTRIES
export const HISTORY_MAX_BYTES: number = SPRITE_EDITOR_HISTORY.MAX_BYTES

export function createHistory(): History {
  return { entries: [], cursor: -1 }
}

export function canUndo(history: History): boolean {
  return history.cursor >= 0
}

export function canRedo(history: History): boolean {
  return history.cursor < history.entries.length - 1
}

function bytesOfSnapshot(snapshot: StructuralDocSnapshot): number {
  return snapshot.timeline.frames.reduce(
    (sum, f) => sum + f.layers.reduce((s, l) => s + l.pixels.data.byteLength, 0),
    0
  )
}

function bytesOfFrame(frame: AnimationFrame): number {
  return frame.layers.reduce((s, l) => s + l.pixels.data.byteLength, 0)
}

/**
 * Byte cost of one entry, used by `pushEntry`'s eviction budget.
 * `layer.meta`/`layer.reorder` carry no pixel data at all (scalars only) —
 * they cost effectively 0 toward the budget, which is the whole point of
 * judgment-day round 2's fix (a visibility toggle used to cost the entire
 * document, twice).
 */
export function entryBytes(entry: HistoryEntry): number {
  switch (entry.kind) {
    case 'patch':
      return entry.patches.reduce((sum, p) => sum + p.before.byteLength + p.after.byteLength, 0)
    case 'doc.replace':
      return bytesOfSnapshot(entry.before) + bytesOfSnapshot(entry.after)
    case 'layer.add':
    case 'layer.remove':
      return entry.layer.pixels.data.byteLength
    case 'frame.add':
    case 'frame.remove':
      return bytesOfFrame(entry.frame)
    case 'frame.paste':
      return entry.frames.reduce((sum, f) => sum + bytesOfFrame(f), 0)
    case 'layer.meta':
    case 'layer.reorder':
      return 0
    case 'doc.resize':
      return entry.strips.reduce((sum, s) => sum + s.bytes.byteLength, 0)
    default: {
      const _exhaustive: never = entry
      return 0
    }
  }
}

function totalBytes(entries: readonly HistoryEntry[]): number {
  return entries.reduce((sum, e) => sum + entryBytes(e), 0)
}

export function historyBytes(history: History): number {
  return totalBytes(history.entries)
}

/**
 * Pushes a new entry, discarding any redo branch beyond the current cursor
 * (classic undo-stack truncation), then evicts the OLDEST entries first
 * until both `HISTORY_MAX_ENTRIES` and `HISTORY_MAX_BYTES` hold — never
 * evicting the just-pushed (newest) entry itself, so the most recent action
 * is always undoable, and the budget is enforced even when that newest
 * entry alone exceeds it (it is kept alone; the caller can inspect
 * `entryBytes`/`historyBytes` to report the overflow — judgment-day round 2:
 * "never exceed silently").
 */
export function pushEntry(history: History, entry: HistoryEntry): History {
  const entries = [...history.entries.slice(0, history.cursor + 1), entry]

  let start = 0
  let bytes = totalBytes(entries)
  while (entries.length - start > 1 && (entries.length - start > HISTORY_MAX_ENTRIES || bytes > HISTORY_MAX_BYTES)) {
    bytes -= entryBytes(entries[start])
    start += 1
  }

  const bounded = start > 0 ? entries.slice(start) : entries
  return { entries: bounded, cursor: bounded.length - 1 }
}

export interface PoppedEntry {
  readonly entry: HistoryEntry
  readonly history: History
}

/**
 * The new model stores before/after PATCH data for each entry (not a full
 * after-state snapshot), so "before" is always available regardless of
 * stack position — the first dispatched command is undoable, same as every
 * other.
 */
export function popUndo(history: History): PoppedEntry | null {
  if (!canUndo(history)) return null
  return { entry: history.entries[history.cursor], history: { ...history, cursor: history.cursor - 1 } }
}

export function popRedo(history: History): PoppedEntry | null {
  if (!canRedo(history)) return null
  const cursor = history.cursor + 1
  return { entry: history.entries[cursor], history: { ...history, cursor } }
}
