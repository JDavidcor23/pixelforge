import type { StateCreator } from 'zustand'

import type { SpriteEditorStore } from '@/app/editor/types'
import { SPRITE_EDITOR_DEFAULTS } from '@/app/editor/constants'

import type { ToolSlice } from '../types/slices'

export const createToolSlice: StateCreator<
  SpriteEditorStore,
  [['zustand/persist', unknown]],
  [],
  ToolSlice
> = (set) => ({
  activeTool: 'pencil',
  primaryColor: { ...SPRITE_EDITOR_DEFAULTS.PRIMARY_COLOR },
  secondaryColor: { ...SPRITE_EDITOR_DEFAULTS.SECONDARY_COLOR },
  cursorPixel: null,

  setPrimaryColor: (color) => set({ primaryColor: color }),
  setSecondaryColor: (color) => set({ secondaryColor: color }),
  setCursorPixel: (coord) => set({ cursorPixel: coord }),
})
