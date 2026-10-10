import { describe, it, expect } from 'vitest'

import { useSpriteEditorStore } from '@/stores'
import { createEmptyBuffer } from '../pixel-buffer'
import { TsPixelCore } from './pixel-core'
import { setIdSeed, type DocSnapshot } from './ts-core'

/**
 * Judgment-day phase 4f, findings W4 and W5. Root causes and fixes, both in
 * `ts-core.ts`:
 *
 * - W4a: `createCoreState` picked a FRESH idSeed override from the sticky
 *   module-level `idSeedOverride`, but always started its frame/layer
 *   counters at 0 — so a seeded core constructed from an IMPORTED payload
 *   that already contains ids minted under that same seed immediately
 *   re-minted an id already in use. Fixed: `createCoreState` now scans the
 *   doc it's given for the highest existing `${idSeed}-f/l${n}` suffix and
 *   starts its counters past it; `setIdSeed`'s override is also consumed
 *   exactly once (no sticky module global).
 * - W4b: `payloadToDoc` trusted every frame/layer id in a payload verbatim,
 *   even duplicates — and the pixel cache (`core.slice.ts`) is keyed
 *   GLOBALLY by layer id, so two frames sharing one layer id aliased one
 *   frame's pixels onto the other. Fixed: `payloadToDoc` now de-duplicates,
 *   keeping the first occurrence and minting a fresh id for every later one.
 * - W5: `frame.paste`/`doc.replace` validated a layer/frame's DECLARED
 *   `w`/`h` against the canvas, but never the ACTUAL `data.byteLength`
 *   against `w*h*4` — a layer declaring the right dimensions but carrying a
 *   too-short/too-long buffer was accepted and corrupted the live document.
 *   `frame.paste` also accepted a frame with ZERO layers, which would mint a
 *   dangling `activeLayerId`. Fixed: both commands now validate byte length,
 *   and `frame.paste` rejects empty-layer frames outright.
 *
 * Fix-agent phase 5f.2 (`verify-report-phase-5.md` CRITICAL finding): the
 * test below ("a seeded core re-importing...") passed BEFORE this fix too,
 * but for the wrong reason — `TsPixelCore.importDocument` evaluates
 * `createCoreState(payloadToDoc(doc))` left-to-right, and `payloadToDoc`
 * used to call `makeLocalIdMinter()` UNCONDITIONALLY (even for this
 * perfectly healthy payload), which consumed-and-nulled `setIdSeed('s')`'s
 * one-shot override before `createCoreState` ever ran — so `b`'s actual
 * seed after `importDocument` was a random UUID prefix, not `'s'`. The test
 * still passed because a random prefix trivially avoids colliding with
 * `'s'`-prefixed ids, not because `createCoreState`'s `highestIdSuffix` scan
 * was ever exercised under a REAL same-seed collision through the
 * `importDocument` path. Fixed by making `payloadToDoc`'s minter
 * construction lazy (`ts-core.ts`) — it is only built (and only then
 * consumes `idSeedOverride`) when a payload actually needs a fallback layer
 * or a duplicate-id repair, which this healthy payload never does. The test
 * now asserts the core's actual seed directly (`(b as any).state.idSeed`),
 * not just id uniqueness, so a regression to the eager-consumption bug fails
 * loudly instead of passing by random-prefix coincidence.
 */

function makeDoc(w = 2, h = 2): DocSnapshot {
  return {
    canvasWidth: w,
    canvasHeight: h,
    timeline: {
      frames: [{ id: 'F0', layers: [{ id: 'L0', name: 'a', visible: true, locked: false, opacity: 100, pixels: createEmptyBuffer(w, h) }], activeLayerId: 'L0', durationMs: 83 }],
      currentFrameIndex: 0,
      isPlaying: false,
      fps: 12,
      loop: true,
      selectedFrameIndices: [0],
    },
  }
}

describe('id-seed collisions on import (W4)', () => {
  it('a seeded core re-importing a payload that already contains ids under the SAME seed never re-mints a used id', () => {
    setIdSeed('s')
    const a = new TsPixelCore(makeDoc())
    a.dispatch({ type: 'frame.add' }) // mints 's-f1' / 's-l1'
    const payload = a.exportDocument()

    // `new TsPixelCore(...)`'s constructor itself calls `createCoreState`
    // (and so would consume `setIdSeed` immediately if called before this
    // line) — `setIdSeed` is called AFTER `b` already exists, isolating the
    // override to the `importDocument()` call under test, exactly like
    // production code (restoring a draft into an ALREADY-CONSTRUCTED
    // store-owned core) does.
    const b = new TsPixelCore(makeDoc())
    setIdSeed('s') // deliberately force the SAME seed collision a random pick could only hit by unlucky chance
    b.importDocument(payload) // re-seeds `b`'s internal core from `payload`, still under seed 's'

    // Fix-agent 5f.2: assert the core's ACTUAL seed, not just id uniqueness —
    // this is what the pre-fix bug (`setIdSeed` silently discarded by
    // `payloadToDoc`'s eager minter) could not have passed, since `b` would
    // have landed on a random UUID prefix instead.
    expect((b as unknown as { state: { idSeed: string } }).state.idSeed).toBe('s')

    b.dispatch({ type: 'frame.add' }) // must NOT re-mint 's-l1' (already used by the imported frame)

    const importedIds = new Set(payload.frames.flatMap((f) => f.layers.map((l) => l.id)))
    expect(importedIds.has('s-l1')).toBe(true) // sanity: the payload really does carry a seed-'s' id

    const ids = b.snapshot().timeline.frames.flatMap((f) => f.layers.map((l) => l.id))
    expect(new Set(ids).size).toBe(ids.length)
    // Every id MINTED BY `b` ITSELF (i.e. not one of the fixture/imported
    // ids `makeDoc()`/`payload` already carried) carries the 's-' prefix
    // (proves the seed propagated, not merely that SOME prefix avoided a
    // collision), and continues the counter PAST the highest suffix already
    // in the payload ('s-l1') rather than restarting at 1.
    const newlyMintedIds = ids.filter((id) => !importedIds.has(id) && id !== 'L0')
    expect(newlyMintedIds.length).toBeGreaterThan(0)
    for (const id of newlyMintedIds) {
      expect(id.startsWith('s-l')).toBe(true)
      const n = Number(id.slice('s-l'.length))
      expect(n).toBeGreaterThan(1)
    }
  })

  it('setIdSeed is NOT discarded by importDocument when the payload is healthy (no fallback layer, no duplicate ids needed)', () => {
    // Direct regression for the CRITICAL finding: payloadToDoc must not
    // construct (and thereby consume) its id minter unless it actually needs
    // to mint a fallback/duplicate-repair id. `new TsPixelCore(...)`'s own
    // constructor calls `createCoreState` too, so `setIdSeed` is called
    // AFTER both cores already exist — isolating the override to the single
    // `importDocument()` call under test, exactly like production code
    // (restoring a draft into an ALREADY-CONSTRUCTED store-owned core) does.
    const b = new TsPixelCore(makeDoc())
    const payload = b.exportDocument() // 'F0'/'L0' — not seed-prefixed, no duplicates, no corruption

    const c = new TsPixelCore(makeDoc())
    setIdSeed('healthy-seed')
    c.importDocument(payload)
    expect((c as unknown as { state: { idSeed: string } }).state.idSeed).toBe('healthy-seed')
  })
})

describe('duplicate frame/layer ids on import are repaired (W4)', () => {
  it('a payload with the same layer id reused across two frames gets a fresh id for the duplicate, never aliased cache bytes', () => {
    const p = {
      schemaVersion: 1,
      w: 1,
      h: 1,
      frameMs: [83, 83],
      frames: [
        { id: 'A', activeLayerId: 'X', layers: [{ id: 'X', name: 'a', visible: true, locked: false, opacity: 100, data: new Uint8Array([255, 0, 0, 255]) }] },
        { id: 'B', activeLayerId: 'X', layers: [{ id: 'X', name: 'b', visible: true, locked: false, opacity: 100, data: new Uint8Array([0, 0, 255, 255]) }] },
      ],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any

    useSpriteEditorStore.getState().importDocument(p)
    const s = useSpriteEditorStore.getState()

    expect(s.timeline.frames[0].layers[0].id).not.toBe(s.timeline.frames[1].layers[0].id)
    expect(Array.from(s.timeline.frames[0].layers[0].pixels.data)).toEqual([255, 0, 0, 255])
    expect(Array.from(s.timeline.frames[1].layers[0].pixels.data)).toEqual([0, 0, 255, 255])
    // The core's own export must agree with the store's cache-backed read.
    const exported = s.exportDocument()
    expect(Array.from(exported.frames[0].layers[0].data)).toEqual([255, 0, 0, 255])
    expect(Array.from(exported.frames[1].layers[0].data)).toEqual([0, 0, 255, 255])
  })

  it('a payload with the same frame id reused twice gets a fresh id for the duplicate', () => {
    const p = {
      schemaVersion: 1,
      w: 1,
      h: 1,
      frameMs: [83, 83],
      frames: [
        { id: 'DUP', activeLayerId: 'L1', layers: [{ id: 'L1', name: 'a', visible: true, locked: false, opacity: 100, data: new Uint8Array([1, 2, 3, 4]) }] },
        { id: 'DUP', activeLayerId: 'L2', layers: [{ id: 'L2', name: 'b', visible: true, locked: false, opacity: 100, data: new Uint8Array([5, 6, 7, 8]) }] },
      ],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any

    useSpriteEditorStore.getState().importDocument(p)
    const s = useSpriteEditorStore.getState()
    expect(s.timeline.frames[0].id).not.toBe(s.timeline.frames[1].id)
  })
})

describe('frame.paste / doc.replace reject malformed buffers and empty-layer frames (W5)', () => {
  it('frame.paste rejects a layer whose data.byteLength does not match its declared w*h*4', () => {
    const c = new TsPixelCore(makeDoc())
    const r = c.dispatch({
      type: 'frame.paste',
      at: 1,
      frames: [{ durationMs: 83, layers: [{ name: 'x', visible: true, locked: false, opacity: 100, w: 2, h: 2, data: new Uint8Array(3) }] }],
    })
    expect(r.changed).toBe(false)
    expect(c.snapshot().timeline.frames).toHaveLength(1) // untouched
  })

  it('frame.paste rejects a frame with zero layers', () => {
    const c = new TsPixelCore(makeDoc())
    const r = c.dispatch({ type: 'frame.paste', at: 1, frames: [{ durationMs: 83, layers: [] }] })
    expect(r.changed).toBe(false)
    expect(c.snapshot().timeline.frames).toHaveLength(1)
  })

  it('doc.replace rejects a frame whose pixels.data.byteLength does not match canvasWidth*canvasHeight*4', () => {
    const c = new TsPixelCore(makeDoc())
    const r = c.dispatch({
      type: 'doc.replace',
      canvasWidth: 2,
      canvasHeight: 2,
      frames: [{ pixels: { w: 2, h: 2, data: new Uint8ClampedArray(5) } }],
      frameDurationMs: 83,
      label: 'r',
    })
    expect(r.changed).toBe(false)
    expect(c.snapshot().canvasWidth).toBe(2)
    expect(c.readLayer('F0', 'L0')).toHaveLength(2 * 2 * 4) // original document untouched
  })

  it('a valid frame.paste still works after the invalid ones were rejected (no partial corruption)', () => {
    const c = new TsPixelCore(makeDoc())
    c.dispatch({ type: 'frame.paste', at: 1, frames: [{ durationMs: 83, layers: [{ name: 'x', visible: true, locked: false, opacity: 100, w: 2, h: 2, data: new Uint8Array(3) }] }] })
    const r = c.dispatch({
      type: 'frame.paste',
      at: 1,
      frames: [{ durationMs: 83, layers: [{ name: 'x', visible: true, locked: false, opacity: 100, w: 2, h: 2, data: new Uint8Array(16) }] }],
    })
    expect(r.changed).toBe(true)
    expect(c.snapshot().timeline.frames).toHaveLength(2)
  })
})
