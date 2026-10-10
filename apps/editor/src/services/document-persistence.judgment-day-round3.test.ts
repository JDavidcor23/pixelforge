import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { startDocumentPersistence } from './document-persistence.controller'
import { createInMemoryDocumentRepository } from './in-memory-document.repository.service'
import { useSpriteEditorStore } from '@/stores'
import { packPoints, packRgba } from '@/lib/core/color-codec'
import { LOCAL_DRAFT_DOCUMENT_ID } from '@/constants/persistence'
import type { DocumentPayload } from '@/types/document'

/**
 * Judgment-day round 3, bug #1 (CRITICAL): six `ts-core.ts` reducers reset
 * `layerRevisions`/`contentRevision` on every call instead of preserving
 * them, so two consecutive `undo()`s produced the SAME `layerRevisions`
 * value both times — and, at the autosave layer, risked saving a STALE
 * revision. Ported from the judge's `slice.test.ts` ("S1") repro.
 */
describe('judgment-day round 3 bug #1 (slice level): consecutive undos and autosave', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useSpriteEditorStore.setState({ docStatus: 'loading' })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('S1: two consecutive undos bump layerRevisions each time, and the final flush saves exactly the live state', async () => {
    const repo = createInMemoryDocumentRepository()
    const storeApi = {
      getState: () => useSpriteEditorStore.getState(),
      setState: (p: object) => useSpriteEditorStore.setState(p),
      subscribe: (l: (s: { docRevision: number }) => void) => useSpriteEditorStore.subscribe(l),
      exportDocument: () => useSpriteEditorStore.getState().exportDocument(),
      importDocument: (p: DocumentPayload) => useSpriteEditorStore.getState().importDocument(p),
    }
    const ctrl = await startDocumentPersistence({
      resolveRepository: async () => ({ repository: repo, isPersistent: true }),
      storage: { getItem: () => null, removeItem: () => {} },
      store: storeApi,
      debounceMs: 800,
      scheduleTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms),
      clearScheduledTimeout: (h: unknown) => clearTimeout(h as ReturnType<typeof setTimeout>),
      onPersistentChange: () => {},
    })

    const draw = (x: number) => {
      const s = useSpriteEditorStore.getState()
      s.dispatch({ type: 'stroke.begin', layerId: s.activeLayerId })
      s.dispatch({ type: 'stroke.points', points: packPoints([{ x, y: 0 }]), rgba: packRgba({ r: 255, g: 0, b: 0, a: 255 }) })
      s.dispatch({ type: 'stroke.end', label: 'Draw' })
    }

    draw(0)
    draw(1)
    await vi.advanceTimersByTimeAsync(1000)

    const L = useSpriteEditorStore.getState().activeLayerId
    useSpriteEditorStore.getState().undo()
    const rev1 = useSpriteEditorStore.getState().layerRevisions[L]
    await vi.advanceTimersByTimeAsync(1000)

    useSpriteEditorStore.getState().undo()
    const rev2 = useSpriteEditorStore.getState().layerRevisions[L]
    await vi.advanceTimersByTimeAsync(1000)

    ctrl.flush()
    ctrl.stop()

    const stored = await repo.load(LOCAL_DRAFT_DOCUMENT_ID)
    expect(stored).not.toBeNull()

    const savedLayer = stored!.payload.frames[0].layers.find((l) => l.id === L)!
    const liveLayer = useSpriteEditorStore.getState().layers.find((l) => l.id === L)!
    const savedAlpha0 = savedLayer.data[3] // byte 3 of pixel (0,0) = alpha
    const liveAlpha0 = liveLayer.pixels.data[3]

    expect(rev2).not.toBe(rev1) // bug #1: used to be equal (reset to {} then re-incremented to 1 every time)
    expect(savedAlpha0).toBe(liveAlpha0) // autosave must have captured the SECOND undo, not a stale revision
  })
})
