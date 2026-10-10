import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { startDocumentPersistence } from './document-persistence.controller'
import { createInMemoryDocumentRepository } from './in-memory-document.repository.service'
import { useSpriteEditorStore } from '@/stores'
import { packPoints, packRgba } from '@/lib/core/color-codec'
import type { DocumentPayload } from '@/types/document'

/**
 * Permanent regression test for judgeB's `persist.judge.test.ts` repro
 * ("remount within debounce window loses last stroke"), rewritten with real
 * assertions against the phase 2c fix instead of diagnostic `console.log`s.
 *
 * Root cause (two bugs, both fixed in `document-persistence.controller.ts`):
 *  1. `stop()` cancelled any pending debounced save instead of flushing it —
 *     a stroke drawn within the debounce window right before unmount was
 *     silently dropped from the repository.
 *  2. On remount, the controller unconditionally re-ran `repository.load()`
 *     + `importDocument()`, overwriting whatever the core held in memory
 *     (which could be NEWER than the last successful save) with the stale
 *     saved draft. Fixed by gating restore on `docStatus` — a remount within
 *     the same session (the zustand store is a page-lifetime singleton)
 *     sees `docStatus` still `'ready'` from the prior mount and skips
 *     restore entirely, trusting the in-memory document.
 */
describe('document persistence: remount within the debounce window', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useSpriteEditorStore.setState({ docStatus: 'loading' })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not lose a pending stroke that was flushed on stop(), and does not re-import the stale draft on remount', async () => {
    const repo = createInMemoryDocumentRepository()
    const storeApi = {
      getState: () => useSpriteEditorStore.getState(),
      setState: (p: object) => useSpriteEditorStore.setState(p),
      subscribe: (l: (s: { docRevision: number }) => void) => useSpriteEditorStore.subscribe(l),
      exportDocument: () => useSpriteEditorStore.getState().exportDocument(),
      importDocument: (p: DocumentPayload) => useSpriteEditorStore.getState().importDocument(p),
    }
    const deps = {
      resolveRepository: async () => ({ repository: repo, isPersistent: true }),
      storage: { getItem: () => null, removeItem: () => {} },
      store: storeApi,
      debounceMs: 800,
      scheduleTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms),
      clearScheduledTimeout: (h: unknown) => clearTimeout(h as ReturnType<typeof setTimeout>),
      onPersistentChange: () => {},
    }

    const draw = (x: number) => {
      const s = useSpriteEditorStore.getState()
      s.dispatch({ type: 'stroke.begin', layerId: s.activeLayerId })
      s.dispatch({ type: 'stroke.points', points: packPoints([{ x, y: 0 }]), rgba: packRgba({ r: 255, g: 0, b: 0, a: 255 }) })
      s.dispatch({ type: 'stroke.end', label: 'Draw' })
    }

    const c1 = await startDocumentPersistence(deps)

    draw(0)
    vi.advanceTimersByTime(1000) // 1st stroke's debounced save fires and completes
    await Promise.resolve()

    draw(1) // 2nd stroke — still inside the 800ms debounce window
    const alphaBeforeStop = useSpriteEditorStore.getState().layers[0].pixels.data[4 * 1 + 3]
    expect(alphaBeforeStop).toBe(255) // sanity: the 2nd stroke did land in the live store

    c1.stop() // must FLUSH the pending save instead of dropping it
    await Promise.resolve()

    const savedBeforeRemount = await repo.load('local-draft')
    expect(savedBeforeRemount).not.toBeNull()
    // the flushed save must include the 2nd stroke's pixel, not just the 1st's.
    expect(savedBeforeRemount!.payload.frames[0].layers[0].data[4 * 1 + 3]).toBe(255)

    await startDocumentPersistence(deps) // remount within the same session (docStatus is still 'ready')

    const stAfter = useSpriteEditorStore.getState()
    expect(stAfter.docStatus).toBe('ready') // never flashed back to 'loading'
    expect(stAfter.layers[0].pixels.data[4 * 1 + 3]).toBe(255) // 2nd stroke still present — not rolled back
    expect(stAfter.canUndo).toBe(true) // undo history preserved — remount did NOT re-import and reset it
  })
})
