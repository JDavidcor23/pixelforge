import { describe, it, expect } from 'vitest'
import type { AnimationFrame, Layer } from '@/types'
import { createEmptyBuffer } from '@/lib/pixel-buffer'
import { packPoints } from './color-codec'
import { frameToSerializedFrame } from './serialize'
import { createCoreState, currentFrame, currentLayers, dispatchCommand, type CoreState, type DocSnapshot } from './ts-core'
import type { Command } from './commands'

/**
 * Judgment-day round 3 fuzz test (`judgeB3/fuzz.test.ts`), ported into the
 * permanent core contract suite per the orchestrator's instruction: random
 * command sequences must always satisfy four invariants regardless of which
 * commands fire in which order —
 *   1. undoing EVERY entry returns the document to its exact initial state,
 *   2. redoing everything back returns it to its exact final state,
 *   3. there is never a dangling `activeLayerId` (pointing at a removed layer),
 *   4. every layer's buffer always matches `w*h*4` bytes.
 *
 * This is the future TS<->Wasm parity gate for the WHOLE command surface
 * (`pixel-core.contract.test.ts` covers the interface shape; this covers
 * cross-command behavioral invariants) — a future `WasmCore` must satisfy
 * the same four invariants over the same fixed seeds.
 *
 * A fixed, small set of seeds keeps this fast and deterministic for CI (a
 * failure is always reproducible by seed number, never "sometimes flaky").
 * `layerRevisions` not bumping for a touched layer is tracked (logged) but
 * NOT part of the hard pass/fail bar — that invariant interacts with history
 * eviction edge cases that are out of scope for this pass (same as the
 * original judge repro).
 */

const W = 5
const H = 4

function mkLayer(id: string): Layer {
  return { id, name: id, visible: true, locked: false, opacity: 100, pixels: createEmptyBuffer(W, H) }
}

function mkDoc(): DocSnapshot {
  const f: AnimationFrame = { id: 'F0', layers: [mkLayer('L0'), mkLayer('L1')], activeLayerId: 'L0', durationMs: 100 }
  return { canvasWidth: W, canvasHeight: H, timeline: { frames: [f], currentFrameIndex: 0, isPlaying: false, fps: 12, loop: true, selectedFrameIndices: [0] } }
}

function sig(d: DocSnapshot): string {
  return JSON.stringify({
    w: d.canvasWidth,
    h: d.canvasHeight,
    frames: d.timeline.frames.map((f) => ({
      id: f.id,
      dur: f.durationMs,
      layers: f.layers.map((l) => ({
        id: l.id,
        n: l.name,
        v: l.visible,
        k: l.locked,
        o: l.opacity,
        w: l.pixels.w,
        h: l.pixels.h,
        d: Array.from(l.pixels.data).join(','),
      })),
    })),
  })
}

function rng(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
}

const SEEDS = 200
const STEPS_PER_SEED = 40

describe('ts-core fuzz: random command sequences', () => {
  it(`undo-all == initial, redo-all == final, no dangling active layer, every buffer is w*h*4 bytes (${SEEDS} seeds x ${STEPS_PER_SEED} steps)`, () => {
    const failures: string[] = []
    const revisionMismatches: string[] = []

    for (let seed = 1; seed <= SEEDS; seed++) {
      const r = rng(seed)
      const ri = (max: number) => Math.floor(r() * max)
      let s: CoreState = createCoreState(mkDoc())
      const init = sig(s.doc)
      const log: string[] = []
      let clip: AnimationFrame[] | null = null

      for (let step = 0; step < STEPS_PER_SEED; step++) {
        const layers = currentLayers(s.doc)
        const lid = layers[ri(layers.length)].id
        const frames = s.doc.timeline.frames

        const choices: Command[] = [
          { type: 'stroke.begin', layerId: lid },
          { type: 'stroke.points', points: packPoints([{ x: ri(W + 1), y: ri(H) }, { x: ri(W), y: ri(H) }]), rgba: ((ri(4) * 0x40000000 + 0xff) >>> 0) },
          { type: 'stroke.end', label: 'Draw' },
          { type: 'fill', layerId: lid, x: ri(W), y: ri(H), rgba: ((ri(3) * 0x11000000 + 0xff) >>> 0) },
          { type: 'frame.add' },
          { type: 'frame.remove', index: ri(frames.length) },
          { type: 'frame.select', index: ri(frames.length) },
          { type: 'layer.add' },
          { type: 'layer.remove', layerId: lid },
          { type: 'layer.meta', layerId: lid, patch: { visible: r() < 0.5, locked: r() < 0.3, opacity: ri(3) * 50 } },
          { type: 'layer.reorder', from: ri(layers.length), to: ri(layers.length) },
          { type: 'layer.setActive', layerId: lid },
          { type: 'region.clear', layerId: lid, rect: { x: ri(W) - 1, y: ri(H) - 1, w: ri(3) + 1, h: ri(3) + 1 } },
          { type: 'selection.commit', layerId: lid, at: { x: ri(W - 1), y: ri(H - 1), w: 1, h: 1 }, pixels: new Uint8ClampedArray([ri(256), 0, 0, 255]) },
          { type: 'undo' },
          { type: 'redo' },
          { type: 'undo' },
          { type: 'timeline.togglePlayback' },
          { type: 'timeline.setFps', fps: ri(30) },
        ]
        if (clip) choices.push({ type: 'frame.paste', at: ri(frames.length + 1), frames: clip.map(frameToSerializedFrame) })
        if (r() < 0.05) clip = [currentFrame(s.doc)]
        if (r() < 0.03) {
          choices.push({ type: 'doc.replace', canvasWidth: W, canvasHeight: H, frames: [{ pixels: createEmptyBuffer(W, H) }], frameDurationMs: 80, label: 'AI' })
        }

        const c = choices[ri(choices.length)]
        log.push(c.type)
        const prevRevs = { ...(s.layerRevisions ?? {}) }
        const o = dispatchCommand(s, c)
        s = o.state

        for (const d of o.result.dirty) {
          if ((s.layerRevisions ?? {})[d.layerId] === prevRevs[d.layerId]) {
            revisionMismatches.push(`seed ${seed} step ${step} ${c.type}: dirty layer ${d.layerId} revision unchanged`)
          }
        }

        const f = currentFrame(s.doc)
        if (!f || !f.layers.some((l) => l.id === f.activeLayerId)) {
          failures.push(`seed ${seed} step ${step} ${c.type}: dangling active layer`)
        }
        for (const fr of s.doc.timeline.frames) {
          for (const l of fr.layers) {
            if (l.pixels.data.length !== W * H * 4) failures.push(`seed ${seed} step ${step} ${c.type}: bad buffer size`)
          }
        }
      }

      s = dispatchCommand(s, { type: 'stroke.end', label: 'Draw' }).state
      const fin = sig(s.doc)
      const finCursor = s.history.cursor

      let guard = 0
      while (s.history.cursor >= 0 && guard++ < 1000) s = dispatchCommand(s, { type: 'undo' }).state
      if (sig(s.doc) !== init) failures.push(`seed ${seed}: undo-all != initial (${log.join(' ')})`)

      while (s.history.cursor < finCursor && guard++ < 2000) s = dispatchCommand(s, { type: 'redo' }).state
      if (sig(s.doc) !== fin) failures.push(`seed ${seed}: redo-all != final`)
    }

    // `revisionMismatches` is intentionally NOT asserted on — see module doc
    // ("tracked, not part of the hard pass/fail bar"). Kept as a local so a
    // debugger can inspect it without re-running the fuzz loop.
    void revisionMismatches
    expect(failures).toEqual([])
  })
})
