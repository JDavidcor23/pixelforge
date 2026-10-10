import { describe, it, expect } from 'vitest'
import { createCoreState, currentActiveLayerId, dispatchCommand, type DocSnapshot } from './core/ts-core'
import { packPoints, packRgba } from './core/color-codec'
import { createEmptyBuffer } from './pixel-buffer'
import type { AnimationFrame, Layer } from '@/types'

// Phase 2 measurement — supersedes the phase 0/1 baseline this file used to
// record (see git history / baseline-bench.md for the old number: one
// `pushHistory()` full-document-snapshot entry on this exact reference
// scenario cost 589,824 bytes / 576.0 KB). That cost model (`lib/history.ts`'s
// old `createSnapshot`) is gone; this measures the NEW dirty-rect entry
// `lib/core/ts-core.ts`'s dispatch engine produces for the identical
// scenario, against the edit-history "Bounded Undo Memory" budget (<1KB).

const CANVAS_SIZE = 64
const FRAME_COUNT = 8
const LAYER_COUNT = 4
const RED = { r: 255, g: 0, b: 0, a: 255 }

function makeLayer(id: string): Layer {
  return {
    id,
    name: `Layer ${id}`,
    visible: true,
    locked: false,
    opacity: 100,
    pixels: createEmptyBuffer(CANVAS_SIZE, CANVAS_SIZE),
  }
}

function makeDoc(): DocSnapshot {
  const frames: AnimationFrame[] = Array.from({ length: FRAME_COUNT }, (_, i) => {
    const layers = Array.from({ length: LAYER_COUNT }, (_, j) => makeLayer(`f${i}-l${j}`))
    return { id: `frame-${i}`, layers, activeLayerId: layers[0].id, durationMs: 83 }
  })
  return {
    canvasWidth: CANVAS_SIZE,
    canvasHeight: CANVAS_SIZE,
    timeline: { frames, currentFrameIndex: 0, isPlaying: false, fps: 12, loop: true, selectedFrameIndices: [0] },
  }
}

describe('undo memory — phase 2 dirty-rect history entry (reference scenario)', () => {
  it('a single-pixel stroke on 64x64/8-frame/4-layer retains far under 1KB', () => {
    const doc = makeDoc()
    const layerId = currentActiveLayerId(doc)
    let state = createCoreState(doc)

    state = dispatchCommand(state, { type: 'stroke.begin', layerId }).state
    state = dispatchCommand(state, {
      type: 'stroke.points',
      points: packPoints([{ x: 10, y: 20 }]),
      rgba: packRgba(RED),
    }).state
    state = dispatchCommand(state, { type: 'stroke.end', label: '1px stroke' }).state

    expect(state.history.entries).toHaveLength(1)
    const entry = state.history.entries[0]
    if (entry.kind !== 'patch') throw new Error('expected a patch entry')

    const retainedBytes = entry.patches.reduce((sum, p) => sum + p.before.byteLength + p.after.byteLength, 0)

    // Recorded in openspec/changes/migrate-to-rust-core/baseline-bench.md:
    // phase 0/1 full-snapshot baseline was 589,824 bytes (576.0 KB) for this
    // exact scenario. The dirty-rect entry here is a single 1x1 RGBA patch:
    // 4 bytes `before` + 4 bytes `after` = 8 bytes, regardless of
    // frame/layer count — a ~73,728x reduction.
    expect(retainedBytes).toBe(8)
    expect(retainedBytes).toBeLessThan(1024)
  })
})
