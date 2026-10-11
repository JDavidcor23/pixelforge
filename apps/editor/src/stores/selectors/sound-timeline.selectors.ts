import type { SoundsStore } from '@/stores/types/audio-slices'
import { countClipsForAsset } from '@/lib/timeline-ops'

// Granular, primitive-returning selectors for the sound timeline.
// Usage: `const canUndo = useSoundsStore(selectCanUndo)`.

export const selectCanUndo = (state: SoundsStore): boolean => state.timelinePast.length > 0

export const selectCanRedo = (state: SoundsStore): boolean => state.timelineFuture.length > 0

/** For the delete dialog copy: `useSoundsStore(selectClipCountForAsset(id))`. */
export const selectClipCountForAsset =
  (assetId: string | null) =>
  (state: SoundsStore): number =>
    assetId ? countClipsForAsset(state.clips, assetId) : 0
