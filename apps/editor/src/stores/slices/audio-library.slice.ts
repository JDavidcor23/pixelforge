import type { StateCreator } from 'zustand'

import type { AudioAsset, GenerationRecord } from '@/types/audio'
import type { AudioLibrarySlice, SoundsStore } from '@/stores/types/audio-slices'
import { GENERATION_HISTORY_LIMIT } from '@/constants/audio'

/** `true` when applying `updates` would change at least one field (shallow, `Object.is`). */
const hasChange = (asset: AudioAsset, updates: Partial<AudioAsset>): boolean =>
  (Object.keys(updates) as (keyof AudioAsset)[]).some((key) => !Object.is(asset[key], updates[key]))

export const createAudioLibrarySlice: StateCreator<
  SoundsStore,
  [['zustand/persist', unknown]],
  [],
  AudioLibrarySlice
> = (set, get) => ({
  assets: [],
  selectedAssetId: null,
  searchQuery: '',
  filterTag: null,
  sortBy: 'date',
  sortDirection: 'desc',
  generationHistory: [],

  addAsset: (asset: AudioAsset) =>
    set((state) => ({
      assets: [asset, ...state.assets],
    })),

  removeAsset: (id: string) => {
    set((state) => ({
      assets: state.assets.filter((a) => a.id !== id),
      selectedAssetId: state.selectedAssetId === id ? null : state.selectedAssetId,
    }))
    // A clip without its source cannot play — drop it from the mix and its history.
    get().removeAssetFromTimeline(id)
  },

  updateAsset: (id: string, updates: Partial<AudioAsset>) =>
    set((state) => {
      const target = state.assets.find((a) => a.id === id)
      if (!target || !hasChange(target, updates)) return state
      return {
        assets: state.assets.map((a) =>
          a.id === id ? { ...a, ...updates, revision: (a.revision ?? 0) + 1 } : a,
        ),
      }
    }),

  setSelectedAsset: (id) => set({ selectedAssetId: id }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setFilterTag: (tag) => set({ filterTag: tag }),

  setSortBy: (field) => set({ sortBy: field }),

  setSortDirection: (direction) => set({ sortDirection: direction }),

  addGenerationRecord: (record: GenerationRecord) =>
    set((state) => ({
      generationHistory: [record, ...state.generationHistory].slice(0, GENERATION_HISTORY_LIMIT),
    })),

  clearGenerationHistory: () => set({ generationHistory: [] }),
})
