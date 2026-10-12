import { useEffect, useState } from 'react'

import { useSpriteEditorStore } from '@/stores'
import { resolveDocumentRepository } from '@/services/resolve-document-repository.service'
import { createInMemoryDocumentRepository } from '@/services/in-memory-document.repository.service'
import {
  startDocumentPersistence,
  type DocumentPersistenceController,
  type DocumentPersistenceStoreApi,
} from '@/services/document-persistence.controller'
import { registerDocumentPersistenceFlush } from '@/services/document-persistence-flush-bus.service'
import { DOCUMENT_AUTOSAVE_DEBOUNCE_MS } from '@/constants/persistence'
import type { DocumentPayload } from '@/types/document'

export interface UseDocumentPersistenceResult {
  /** `false` once IndexedDB failed to open and drafts are no longer being saved. */
  readonly isPersistent: boolean
}

/**
 * Mounted once in the editor shell (`SpriteEditorLayout`). Thin React
 * wrapper around `startDocumentPersistence` — all the actual
 * resolve/migrate/restore/autosave ordering logic lives there, framework-free
 * and unit-tested with fake timers. This hook only wires it to React's
 * effect lifecycle, the real `useSpriteEditorStore`, and the
 * `visibilitychange` DOM event.
 *
 * Carry-over item B (phase 1 verify-report WARNING): `startDocumentPersistence`
 * can reject partway through (e.g. the legacy migration's `save()` throwing
 * `QuotaExceededError`) with nothing above it turning that rejection into a
 * recoverable UI state — `docStatus` would never reach `'ready'` and the
 * user would be stuck on "Restoring your draft…" forever. The `.catch()`
 * below:
 *  1. logs the failure (`console.error`),
 *  2. sets `docStatus: 'ready'` so the editor becomes usable, and
 *     `isPersistent: false`, which `SpriteEditorLayout` already renders as
 *     the EXISTING "drafts are not being saved" notice — no new UI,
 *  3. starts a SEPARATE, safe-mode persistence loop against a fresh
 *     in-memory repository (skipping `resolveRepository`/migration
 *     entirely, since we don't know what state they were left in). Edits
 *     made during this session are kept in memory so they aren't silently
 *     lost, but the real stored draft in IndexedDB is never opened or
 *     written to again in this session — the user's saved draft can't be
 *     overwritten by whatever the store happened to hold when the restore
 *     failed.
 */
export function useDocumentPersistence(): UseDocumentPersistenceResult {
  const [isPersistent, setIsPersistent] = useState(true)

  useEffect(() => {
    let cancelled = false
    let controller: DocumentPersistenceController | null = null

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') controller?.flush()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    const storeApi: DocumentPersistenceStoreApi = {
      getState: () => useSpriteEditorStore.getState(),
      setState: (patch) => useSpriteEditorStore.setState(patch),
      subscribe: (listener: (state: { docRevision: number }) => void) => useSpriteEditorStore.subscribe(listener),
      exportDocument: () => useSpriteEditorStore.getState().exportDocument(),
      importDocument: (payload: DocumentPayload) => useSpriteEditorStore.getState().importDocument(payload),
    }

    const adopt = (resolvedController: DocumentPersistenceController) => {
      if (cancelled) {
        resolvedController.stop()
        return
      }
      controller = resolvedController
      // Phase 7f (CRITICAL #2): lets `core.slice.ts` request an immediate
      // flush (bypassing the debounce) right after a Wasm trap demotes to
      // TsPixelCore — see `document-persistence-flush-bus.service.ts`.
      registerDocumentPersistenceFlush(() => controller?.flush())
    }

    startDocumentPersistence({
      resolveRepository: resolveDocumentRepository,
      storage: window.localStorage,
      store: storeApi,
      debounceMs: DOCUMENT_AUTOSAVE_DEBOUNCE_MS,
      scheduleTimeout: (fn, ms) => setTimeout(fn, ms),
      clearScheduledTimeout: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
      onPersistentChange: (persistent) => {
        if (!cancelled) setIsPersistent(persistent)
        // Batch 4: also mirror into the store — `useDocumentPersistence` is
        // only ever mounted once (`SpriteEditorLayout`), so this is the one
        // place other components (TopBar's save-status indicator) can learn
        // about it without mounting this hook, and its side effect, a
        // second time.
        useSpriteEditorStore.setState({ isPersistent: persistent })
      },
      // judgment-day round 2 (finding 8): lets the controller observe THIS
      // effect instance's own cancellation mid-flight (before migration/
      // import/subscribe), not just after the fact via `adopt`'s post-hoc
      // `stop()` — see `document-persistence.controller.ts`.
      isCancelled: () => cancelled,
    })
      .then(adopt)
      .catch((error: unknown) => {
        console.error('Document persistence failed to start; falling back to in-memory storage', error)
        if (cancelled) return

        useSpriteEditorStore.getState().setDocStatus('ready')
        setIsPersistent(false)
        useSpriteEditorStore.setState({ isPersistent: false })

        // Safe-mode loop: a fresh in-memory repository only — never touches
        // the real IndexedDB draft again this session.
        startDocumentPersistence({
          resolveRepository: async () => ({ repository: createInMemoryDocumentRepository(), isPersistent: false }),
          storage: { getItem: () => null, removeItem: () => {} },
          store: storeApi,
          debounceMs: DOCUMENT_AUTOSAVE_DEBOUNCE_MS,
          scheduleTimeout: (fn, ms) => setTimeout(fn, ms),
          clearScheduledTimeout: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
          onPersistentChange: () => {},
          isCancelled: () => cancelled,
        }).then(adopt)
      })

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      registerDocumentPersistenceFlush(null)
      controller?.stop()
    }
  }, [])

  return { isPersistent }
}
