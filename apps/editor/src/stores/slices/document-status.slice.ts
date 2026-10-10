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
})
