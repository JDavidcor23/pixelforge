import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { SpriteEditorStore } from '@/types'
import { SPRITE_EDITOR_CANVAS } from '@/constants'

import { createLayerSlice } from './slices/layer.slice'
import { createToolSlice } from './slices/tool.slice'
import { createCoreSlice } from './slices/core.slice'
import { createTimelineSlice } from './slices/timeline.slice'
import { createSelectionSlice } from './slices/selection.slice'
import { createClipboardSlice } from './slices/clipboard.slice'
import { createCompoundSlice } from './slices/compound.slice'
import { createDocumentStatusSlice } from './slices/document-status.slice'

export const useSpriteEditorStore = create<SpriteEditorStore>()(
  persist(
    (set, get, api) => ({
      canvasWidth: SPRITE_EDITOR_CANVAS.DEFAULT_WIDTH,
      canvasHeight: SPRITE_EDITOR_CANVAS.DEFAULT_HEIGHT,
      // Pure slices — own state only, no cross-slice action calls
      ...createLayerSlice(set, get, api),
      ...createToolSlice(set, get, api),
      ...createCoreSlice(set, get, api),
      ...createTimelineSlice(set, get, api),
      ...createSelectionSlice(set, get, api),
      ...createClipboardSlice(set, get, api),
      ...createDocumentStatusSlice(set, get, api),
      // Compound slice — orchestration, overrides same-name actions from slices above
      ...createCompoundSlice(set, get, api),
    }),
    {
      // Phase 1 (D8): the document itself (layers/timeline/canvas size) now
      // lives in IndexedDB via `useDocumentPersistence`, not here — a
      // `Uint8ClampedArray` doesn't round-trip through this middleware's
      // JSON serialization anyway. This key only keeps UI/tool prefs, so it
      // is renamed (not versioned) to make the split obvious; the old
      // `sprite-editor-core` key is migrated once by
      // `legacy-draft-migration.service.ts` and then removed.
      name: 'sprite-editor-prefs',
      partialize: (state) => ({
        primaryColor: state.primaryColor,
        secondaryColor: state.secondaryColor,
      }),
    }
  )
)
