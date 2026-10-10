import type { Timeline } from '@/types'
import type { DocumentPayload } from '@/types/document'
import { DOCUMENT_SCHEMA_VERSION } from '@/constants/persistence'
import { packPoints } from './color-codec'

/**
 * Test-only helpers (phase 2e). Now that `core.slice.ts` no longer re-syncs
 * from zustand state on every dispatch (`syncCore` is gone — see its module
 * doc), a test can no longer seed the document via
 * `useSpriteEditorStore.setState({ timeline, layers, ... })` and expect the
 * next `dispatch` to pick it up. Seed through the core API instead —
 * `importDocument(payload)`, the exact path production code uses to restore
 * a draft — via {@link timelineToDocumentPayload} below.
 */
export function timelineToDocumentPayload(timeline: Timeline, canvasWidth: number, canvasHeight: number): DocumentPayload {
  return {
    schemaVersion: DOCUMENT_SCHEMA_VERSION,
    w: canvasWidth,
    h: canvasHeight,
    frameMs: timeline.frames.map((f) => f.durationMs),
    frames: timeline.frames.map((f) => ({
      id: f.id,
      activeLayerId: f.activeLayerId,
      layers: f.layers.map((l) => ({
        id: l.id,
        name: l.name,
        visible: l.visible,
        locked: l.locked,
        opacity: l.opacity,
        data: new Uint8Array(l.pixels.data),
      })),
    })),
  }
}

/** Builds the interleaved `x,y` `Int32Array` a `stroke.points` command carries, from the old test convenience shape (`{x,y}[]`). Re-exported from `color-codec.ts` under a test-facing name. */
export const toStrokePoints = packPoints
