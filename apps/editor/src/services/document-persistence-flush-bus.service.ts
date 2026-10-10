/**
 * Phase 7f (CRITICAL #2): a tiny module-scope pub/sub that lets
 * `stores/slices/core.slice.ts` ask the ACTIVE `DocumentPersistenceController`
 * (owned by `useDocumentPersistence.hook.ts`, a React effect) to flush an
 * autosave immediately, bypassing the normal debounce — without either
 * module importing the other (the store slice is framework-free and must
 * stay that way; the persistence hook already depends on the store, so the
 * reverse dependency would be circular).
 *
 * Used for exactly one case today: a Wasm `PixelCore` trap just demoted to
 * `TsPixelCore` (undo history dropped) — the pre-trap content is still fully
 * intact and should hit the repository right away instead of waiting out
 * `DOCUMENT_AUTOSAVE_DEBOUNCE_MS`, in case the user closes the tab before the
 * next debounced save would have fired.
 *
 * `requestImmediateFlush()` is a safe no-op if no controller is registered
 * yet (e.g. a trap during the very first render, before
 * `useDocumentPersistence`'s effect has resolved) — there is nothing to
 * flush yet in that case since `startDocumentPersistence` itself hasn't
 * reached the point of subscribing autosave.
 */
type FlushFn = () => void

let activeFlush: FlushFn | null = null

/** Called by `useDocumentPersistence.hook.ts` once its controller is adopted, and with `null` on cleanup/unmount. */
export function registerDocumentPersistenceFlush(flush: FlushFn | null): void {
  activeFlush = flush
}

/** Called by `core.slice.ts` right after a Wasm trap demotes to `TsPixelCore`. */
export function requestImmediateFlush(): void {
  activeFlush?.()
}

/** Test-only: forgets the registered flush between test cases. */
export function resetDocumentPersistenceFlushBusForTests(): void {
  activeFlush = null
}
