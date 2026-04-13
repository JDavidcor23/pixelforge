import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { SpriteEditorStore } from '@/app/editor/types'
import { SPRITE_EDITOR_CANVAS } from '@/app/editor/constants'

import { createPixelSlice } from './slices/pixel.slice'
import { createLayerSlice } from './slices/layer.slice'
import { createToolSlice } from './slices/tool.slice'
import { createHistorySlice } from './slices/history.slice'
import { createTimelineSlice } from './slices/timeline.slice'
import { createSelectionSlice } from './slices/selection.slice'
import { createClipboardSlice } from './slices/clipboard.slice'
import { createCompoundSlice } from './slices/compound.slice'

export const useSpriteEditorStore = create<SpriteEditorStore>()(
  persist(
    (set, get, api) => ({
      canvasWidth: SPRITE_EDITOR_CANVAS.DEFAULT_WIDTH,
      canvasHeight: SPRITE_EDITOR_CANVAS.DEFAULT_HEIGHT,
      // Pure slices — own state only, no cross-slice action calls
      ...createLayerSlice(set, get, api),
      ...createPixelSlice(set, get, api),
      ...createToolSlice(set, get, api),
      ...createHistorySlice(set, get, api),
      ...createTimelineSlice(set, get, api),
      ...createSelectionSlice(set, get, api),
      ...createClipboardSlice(set, get, api),
      // Compound slice — orchestration, overrides same-name actions from slices above
      ...createCompoundSlice(set, get, api),
    }),
    {
      name: 'sprite-editor-core',
      partialize: (state) => ({
        primaryColor: state.primaryColor,
        secondaryColor: state.secondaryColor,
      }),
    }
  )
)
