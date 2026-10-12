import type { StateCreator } from 'zustand'

import type { SpriteEditorStore } from '@/types'

import type { DocumentStatusSlice } from '../types/slices'

/**
 * Local-draft lifecycle gate (phase 1, D8). Starts `'loading'` on every
 * mount — this is intentionally NOT persisted (see `stores/index.ts`
 * `partialize`) — and flips to `'ready'` once `useDocumentPersistence` has
 * run the legacy migration and restored (or initialized) the draft.
 */
export const createDocumentStatusSlice: StateCreator<
  SpriteEditorStore,
  [['zustand/persist', unknown]],
  [],
  DocumentStatusSlice
> = (set) => ({
  docStatus: 'loading',
  setDocStatus: (status) => set({ docStatus: status }),
  // Batch 4 — visible save status (TopBar). Written directly via `setState`
  // by `document-persistence.controller.ts` around its own debounced
  // `save()`, the same way it already writes `docStatus`; see that file for
  // the 'saving' -> 'saved'/'error' transitions. Never persisted (see
  // `stores/index.ts`'s `partialize`) — every session starts at `'idle'`.
  saveStatus: 'idle',
  lastSavedAt: null,
  saveError: null,
  // Mirrors `useDocumentPersistence`'s own `isPersistent` return value, set
  // via `setState` from that hook's `onPersistentChange` callback — lets
  // components other than the one that mounts the persistence hook (e.g.
  // TopBar) read the same signal without mounting it a second time.
  isPersistent: true,
})
