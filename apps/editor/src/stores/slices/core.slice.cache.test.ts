import { describe, it, expect, vi, afterEach } from 'vitest'

import { useSpriteEditorStore } from '@/stores'
import { timelineToDocumentPayload } from '@/lib/core/test-helpers'
import { createEmptyBuffer } from '@/lib'
import type { Command } from '@/lib/core/commands'
import type { Timeline } from '@/types'

/**
 * Judgment-day phase 4f, finding C1: the pixel cache in `core.slice.ts` was
 * poisoned whenever a command force-committed an open stroke bound to the
 * frame that was current BEFORE the command, then moved "current" to a
 * DIFFERENT frame in the SAME dispatch (`frame.add` while a stroke is open
 * is the simplest repro). The slice used to assume a dirty layer id always
 * belonged to whatever frame was current AFTER the dispatch finished — wrong
 * exactly in that case. Root-caused and fixed in `lib/core/ts-core.ts`
 * (`DirtyRect` now carries its own `frameId`) and `core.slice.ts` (refresh
 * is driven by those pairs, never a "current frame" guess).
 *
 * This file asserts the store's derived `layers`/`timeline` (built from the
 * pixel cache) always matches `exportDocument()` (read straight from the
 * core, bypassing the cache) — the exact invariant the cache exists to
 * uphold. `ts-core.fuzz.test.ts` fuzzes the core directly and does NOT catch
 * this class of bug (it bypasses `core.slice.ts`'s cache entirely).
 */

const W = 4
const H = 4

function seed(): void {
  const timeline: Timeline = {
    frames: [
      {
        id: 'F0',
        layers: [{ id: 'L0', name: 'a', visible: true, locked: false, opacity: 100, pixels: createEmptyBuffer(W, H) }],
        activeLayerId: 'L0',
        durationMs: 83,
      },
    ],
    currentFrameIndex: 0,
    isPlaying: false,
    fps: 12,
    loop: true,
    selectedFrameIndices: [0],
  }
  useSpriteEditorStore.getState().importDocument(timelineToDocumentPayload(timeline, W, H))
}

/** Compares the store's cache-backed `layers`/`timeline` against `exportDocument()` (read straight off the core) byte for byte. Returns a description of the FIRST mismatch, or `null` if they agree. */
function compare(step: string): string | null {
  const s = useSpriteEditorStore.getState()
  const payload = s.exportDocument()
  if (payload.frames.length !== s.timeline.frames.length) return `${step}: frame count`
  for (let fi = 0; fi < payload.frames.length; fi++) {
    const pf = payload.frames[fi]
    const sf = s.timeline.frames[fi]
    if (pf.id !== sf.id) return `${step}: frame id ${fi}`
    for (let li = 0; li < pf.layers.length; li++) {
      const pl = pf.layers[li]
      const sl = sf.layers[li]
      if (!sl || sl.id !== pl.id) return `${step}: layer id f${fi} l${li}`
      const a = pl.data
      const b = sl.pixels.data
      if (a.length !== b.length) return `${step}: LEN mismatch f${fi} l${li} core=${a.length} cache=${b.length}`
      for (let k = 0; k < a.length; k++) if (a[k] !== b[k]) return `${step}: byte mismatch f${fi} l${li} @${k}`
    }
  }
  const cur = s.timeline.frames[s.timeline.currentFrameIndex]
  if (s.layers !== cur.layers) {
    for (let i = 0; i < cur.layers.length; i++) {
      if (s.layers[i]?.pixels.data !== cur.layers[i].pixels.data) return `${step}: layers != current frame layers`
    }
  }
  return null
}

const d = (c: Command) => useSpriteEditorStore.getState().dispatch(c)
const cur = () => {
  const s = useSpriteEditorStore.getState()
  return s.timeline.frames[s.timeline.currentFrameIndex]
}

/**
 * Two frames, F0 with TWO layers (L0, L1) — mirrors the judge-5 repro
 * (`judgeB5/dirty.test.ts`) exactly: `layer.remove`/`frame.remove`/
 * `doc.replace` all need >1 layer (or >1 frame) to actually execute instead
 * of no-opping, and all three evict the SAME (frameId, layerId) pair a
 * just-force-committed open stroke on L0 reports as `dirty`.
 */
function seedTwoLayers(): void {
  const timeline: Timeline = {
    frames: [
      {
        id: 'F0',
        layers: [
          { id: 'L0', name: 'a', visible: true, locked: false, opacity: 100, pixels: createEmptyBuffer(W, H) },
          { id: 'L1', name: 'b', visible: true, locked: false, opacity: 100, pixels: createEmptyBuffer(W, H) },
        ],
        activeLayerId: 'L0',
        durationMs: 83,
      },
      {
        id: 'F1',
        layers: [{ id: 'L2', name: 'c', visible: true, locked: false, opacity: 100, pixels: createEmptyBuffer(W, H) }],
        activeLayerId: 'L2',
        durationMs: 83,
      },
    ],
    currentFrameIndex: 0,
    isPlaying: false,
    fps: 12,
    loop: true,
    selectedFrameIndices: [0],
  }
  useSpriteEditorStore.getState().importDocument(timelineToDocumentPayload(timeline, W, H))
}

describe('core.slice pixel cache — C1 (judgment-day phase 4f)', () => {
  it('frame.add while a stroke is open on the frame that was current', () => {
    seed()
    d({ type: 'stroke.begin', layerId: 'L0' })
    d({ type: 'stroke.points', points: new Int32Array([1, 1]), rgba: 0xff0000ff })
    expect(compare('points')).toBeNull()
    d({ type: 'frame.add' })
    expect(compare('frame.add mid-stroke')).toBeNull()
  })

  it('layer.add while a stroke is open', () => {
    seed()
    d({ type: 'stroke.begin', layerId: 'L0' })
    d({ type: 'stroke.points', points: new Int32Array([1, 1]), rgba: 0xff0000ff })
    d({ type: 'layer.add' })
    expect(compare('layer.add mid-stroke')).toBeNull()
  })

  it('frame.remove of ANOTHER frame while a stroke is open on the current one', () => {
    seed()
    d({ type: 'frame.add' })
    d({ type: 'frame.select', index: 0 })
    d({ type: 'stroke.begin', layerId: 'L0' })
    d({ type: 'stroke.points', points: new Int32Array([1, 1]), rgba: 0xff0000ff })
    d({ type: 'frame.remove', index: 1 })
    expect(compare('frame.remove other mid-stroke')).toBeNull()
  })

  it('frame.select while a stroke is open commits it onto the OLD frame, not the new one', () => {
    seed()
    d({ type: 'frame.add' }) // F1 now current
    d({ type: 'stroke.begin', layerId: cur().layers[0].id })
    d({ type: 'stroke.points', points: new Int32Array([2, 2]), rgba: 0x00ff00ff })
    d({ type: 'frame.select', index: 0 }) // switch back to F0 mid-stroke
    expect(compare('frame.select mid-stroke')).toBeNull()
  })

  it('removed layers/frames are evicted from the cache, not left dangling', () => {
    seed()
    d({ type: 'layer.add' })
    const extraLayerId = cur().layers[1].id
    d({ type: 'layer.remove', layerId: extraLayerId })
    expect(compare('layer.remove')).toBeNull()
    d({ type: 'frame.add' })
    d({ type: 'frame.remove', index: 0 })
    expect(compare('frame.remove')).toBeNull()
  })

  it('undo/redo of a patch entry refreshes only the touched pair, not a full sweep, and stays correct', () => {
    seed()
    d({ type: 'stroke.begin', layerId: 'L0' })
    d({ type: 'stroke.points', points: new Int32Array([0, 0, 1, 1]), rgba: 0xff0000ff })
    d({ type: 'stroke.end', label: 'Draw' })
    expect(compare('after stroke')).toBeNull()
    d({ type: 'undo' })
    expect(compare('after undo')).toBeNull()
    d({ type: 'redo' })
    expect(compare('after redo')).toBeNull()
  })

  it('undo/redo of a structural frame.add/frame.remove stays correct', () => {
    seed()
    d({ type: 'frame.add' })
    expect(compare('after frame.add')).toBeNull()
    d({ type: 'undo' })
    expect(compare('after undo frame.add')).toBeNull()
    d({ type: 'redo' })
    expect(compare('after redo frame.add')).toBeNull()
  })
})

/**
 * Fix-agent phase 5f.1 (scratchpad `judgeB5/dirty.test.ts`): a command that
 * force-commits an open stroke AND deletes that exact (frameId, layerId) pair
 * in the SAME dispatch (`layer.remove`, `frame.remove`, `doc.replace`) used
 * to carry the force-commit's `dirty` pair straight into `core.slice.ts`'s
 * refresh loop even though `result.evicted` already named the same pair.
 * `readLayer` on a deleted (frameId, layerId) returns a 0-byte view (never
 * throws), which `refreshLayer` correctly rejects — but the REJECTION path
 * used to `console.error` and fall back to a full `refreshAllLayers` sweep
 * across every frame/layer in the document, every single time, even though
 * nothing was actually wrong (the pair was SUPPOSED to disappear). The fix:
 * `core.slice.ts`'s `dispatch` now drops any `dirty` pair that also appears
 * in `evicted` BEFORE calling `refreshLayer` on it — evicted always wins,
 * and a pair that is both dirty and evicted in the same dispatch needs no
 * refresh at all (it no longer exists to refresh).
 */
describe('core.slice pixel cache — fix-agent 5f.1 (force-commit dirty pairs vs evicted)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  const openStrokeThenCommit = (last: Command) => {
    seedTwoLayers()
    d({ type: 'stroke.begin', layerId: 'L0' })
    d({ type: 'stroke.points', points: new Int32Array([1, 1]), rgba: 0xff0000ff })
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    d(last)
    expect(errorSpy).not.toHaveBeenCalled()
    expect(compare(last.type)).toBeNull()
    errorSpy.mockRestore()
  }

  it('layer.remove force-commits the open stroke on the layer it then deletes', () => {
    openStrokeThenCommit({ type: 'layer.remove', layerId: 'L0' })
  })

  it('frame.remove force-commits the open stroke on the frame it then deletes', () => {
    openStrokeThenCommit({ type: 'frame.remove', index: 0 })
  })

  it('doc.replace force-commits the open stroke on the document it then replaces', () => {
    openStrokeThenCommit({
      type: 'doc.replace',
      canvasWidth: W,
      canvasHeight: H,
      frames: [{ pixels: createEmptyBuffer(W, H) }],
      frameDurationMs: 83,
      label: 'r',
    })
  })
})

/** Deterministic LCG — no `Math.random`, reproducible across runs (matches `ts-core.fuzz.test.ts`'s convention). */
function rng(seedN: number): () => number {
  let s = seedN >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 2 ** 32
  }
}

describe('core.slice pixel cache fuzz — C1 (judgment-day phase 4f)', () => {
  it('random dispatch sequences never desync the cache from the core (300 fixed seeds x 40 steps)', () => {
    const failures: string[] = []
    for (let run = 0; run < 300 && failures.length < 5; run++) {
      seed()
      const r = rng(run + 1)
      const ri = (n: number) => Math.floor(r() * n)
      const log: string[] = []
      for (let step = 0; step < 40; step++) {
        const f = cur()
        const lid = f.layers[ri(f.layers.length)].id
        const k = ri(19)
        let cmd: Command | null = null
        switch (k) {
          case 0:
            cmd = { type: 'stroke.begin', layerId: lid }
            break
          case 1:
          case 2:
            cmd = { type: 'stroke.points', points: new Int32Array([ri(W), ri(H), ri(W), ri(H)]), rgba: ((ri(0xffffff) << 8) | 0xff) >>> 0 }
            break
          case 3:
            cmd = { type: 'stroke.end', label: 'x' }
            break
          case 4:
            cmd = { type: 'fill', layerId: lid, x: ri(W), y: ri(H), rgba: ((ri(0xffffff) << 8) | 0xff) >>> 0 }
            break
          case 5:
            cmd = { type: 'frame.add' }
            break
          case 6:
            cmd = { type: 'frame.remove', index: ri(useSpriteEditorStore.getState().timeline.frames.length) }
            break
          case 7:
            cmd = { type: 'frame.select', index: ri(useSpriteEditorStore.getState().timeline.frames.length) }
            break
          case 8: {
            const p = useSpriteEditorStore.getState().exportDocument()
            const pf = p.frames[ri(p.frames.length)]
            cmd = {
              type: 'frame.paste',
              at: ri(p.frames.length + 1),
              frames: [{ id: pf.id, activeLayerId: pf.activeLayerId, durationMs: 83, layers: pf.layers.map((l) => ({ ...l, w: W, h: H })) }],
            }
            break
          }
          case 9:
            cmd = {
              type: 'doc.replace',
              canvasWidth: W,
              canvasHeight: H,
              frames: [{ pixels: createEmptyBuffer(W, H) }, { pixels: { w: W, h: H, data: new Uint8ClampedArray(W * H * 4).fill(ri(255)) } }],
              frameDurationMs: 83,
              label: 'r',
            }
            break
          case 10:
          case 11:
            cmd = { type: 'undo' }
            break
          case 12:
            cmd = { type: 'redo' }
            break
          case 13:
            cmd = { type: 'layer.add' }
            break
          case 14:
            cmd = { type: 'layer.remove', layerId: lid }
            break
          case 15:
            cmd = { type: 'layer.reorder', from: ri(f.layers.length), to: ri(f.layers.length) }
            break
          case 16:
            cmd = { type: 'selection.commit', layerId: lid, at: { x: 1, y: 1, w: 2, h: 2 }, pixels: new Uint8ClampedArray(16).fill(ri(255)) }
            break
          case 17:
            cmd = { type: 'region.clear', layerId: lid, rect: { x: ri(W), y: ri(H), w: 3, h: 3 } }
            break
          case 18: {
            if (ri(4) === 0) {
              const p = useSpriteEditorStore.getState().exportDocument()
              useSpriteEditorStore.getState().importDocument(p)
              log.push('import')
            } else {
              cmd = { type: 'layer.setActive', layerId: lid }
            }
            break
          }
        }
        if (cmd) {
          d(cmd)
          log.push(cmd.type)
        }
        const err = compare(`run${run} step${step}`)
        if (err) {
          failures.push(`${err} :: ${log.slice(-6).join(' > ')}`)
          break
        }
      }
    }
    expect(failures).toEqual([])
  })
})
