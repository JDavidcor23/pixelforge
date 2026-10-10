import type { StateCreator } from 'zustand'

import type { EditorPrefsStore } from '@/types'
import { SPRITE_EDITOR_PALETTE } from '@/constants'
import { colorsEqual } from '@/lib'

import type { PaletteSlice } from '../types/slices'

export const createPaletteSlice: StateCreator<
  EditorPrefsStore,
  [['zustand/persist', unknown]],
  [],
  PaletteSlice
> = (set) => ({
  palette: [],

  saveColor: (color) =>
    set((state) => {
      const alreadyExists = state.palette.some((pc) => colorsEqual(pc, color))
      if (alreadyExists || state.palette.length >= SPRITE_EDITOR_PALETTE.MAX_COLORS) {
        return state
      }
      return { palette: [...state.palette, color] }
    }),

  removeColor: (color) =>
    set((state) => ({
      palette: state.palette.filter((pc) => !colorsEqual(pc, color)),
    })),
})
