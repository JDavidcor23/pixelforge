import type { AnimationFrame, Layer } from '@/types'
import { cloneBuffer } from './pixel-buffer'

/**
 * Deep-clone helpers. Phase 2 (migrate-to-rust-core) removed this file's
 * `createSnapshot`/`HistoryEntry` — the undo/redo history itself is now
 * dirty-rect based (`lib/core/history.ts`), not a full deep clone per
 * action. `cloneLayers`/`cloneFrames` stay: `lib/core/ts-core.ts` still
 * needs a full independent copy of the document for STRUCTURAL history
 * entries (`frame.add`/`frame.remove`/`doc.replace` before/after
 * snapshots), where there's no "rect" to diff against.
 *
 * Phase 2b (design D3): the old "current frame" working-copy mechanism
 * these once backed (`saveCurrentFrameSnapshot`/`restoreFrameSnapshot`) was
 * removed — `timeline.frames[i].layers` is now the single source of truth
 * for a frame's pixels, so there is no second copy to keep in sync.
 */
export function cloneLayers(layers: Layer[]): Layer[] {
  return layers.map((layer) => ({
    ...layer,
    pixels: cloneBuffer(layer.pixels),
  }))
}

export function cloneFrames(frames: AnimationFrame[]): AnimationFrame[] {
  return frames.map((frame) => ({
    ...frame,
    layers: cloneLayers(frame.layers),
  }))
}
