import { create } from 'zustand'

import { ANIMATION_HISTORY_STORAGE_KEY, GENERATION_HISTORY_STORAGE_KEY } from '@/constants'
import { parseAnimationHistory, persistAnimationHistory } from '@/lib/animation-history'
import { parseGenerationHistory, persistGenerationHistory } from '@/lib/generation-history'
import type { AIAnimation, AIGeneration } from '@/types'

/**
 * Shared Assets library (Sprite Studio v2): sprite generations and
 * animations produced from the Create/Animate tabs, read by both those tabs
 * and the bottom panel's Assets tab.
 *
 * Deliberately NOT `zustand/persist` — that middleware wraps state in a
 * `{state, version}` envelope, which would silently orphan every array
 * already saved under `GENERATION_HISTORY_STORAGE_KEY` /
 * `ANIMATION_HISTORY_STORAGE_KEY` by the pre-redesign localStorage-effects
 * approach. Reading/writing the same raw-array format by hand here keeps
 * existing users' history intact.
 */
export interface AssetsState {
  readonly generations: AIGeneration[]
  readonly animations: AIAnimation[]
  /**
   * Animation ids whose full-resolution source sheet is still in memory
   * (`animationSheetCache`) and can therefore be downloaded. Session-only —
   * never persisted, matching the pre-redesign behaviour.
   */
  readonly sheetsAvailableForDownload: ReadonlySet<string>
  addGeneration: (generation: Omit<AIGeneration, 'id' | 'timestamp'>) => AIGeneration
  addAnimation: (animation: AIAnimation) => void
  markSheetAvailable: (animationId: string) => void
  /** Account deletion's "also delete what's saved in this browser" checkbox — wipes the AI generation/animation history and its localStorage backing. */
  clearLocalHistory: () => void
}

const readStorage = (key: string): string | null => {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(key)
}

const initialGenerations = parseGenerationHistory(readStorage(GENERATION_HISTORY_STORAGE_KEY)).generations
const initialAnimations = parseAnimationHistory(readStorage(ANIMATION_HISTORY_STORAGE_KEY)).animations

export const useAssetsStore = create<AssetsState>((set, get) => ({
  generations: initialGenerations,
  animations: initialAnimations,
  sheetsAvailableForDownload: new Set<string>(),

  addGeneration: (generation) => {
    const sanitizedBase64 = generation.base64.startsWith('data:')
      ? generation.base64
      : `data:image/png;base64,${generation.base64}`

    const next: AIGeneration = {
      ...generation,
      base64: sanitizedBase64,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    }

    const generations = [next, ...get().generations]
    set({ generations })
    try {
      persistGenerationHistory(localStorage, generations)
    } catch (e) {
      console.error('Failed to persist generation history', e)
    }
    return next
  },

  addAnimation: (animation) => {
    const animations = [animation, ...get().animations]
    set({ animations })
    try {
      persistAnimationHistory(localStorage, animations)
    } catch (e) {
      console.error('Failed to persist animation history', e)
    }
  },

  markSheetAvailable: (animationId) => {
    set((state) => ({
      sheetsAvailableForDownload: new Set(state.sheetsAvailableForDownload).add(animationId),
    }))
  },

  clearLocalHistory: () => {
    set({ generations: [], animations: [], sheetsAvailableForDownload: new Set<string>() })
    try {
      persistGenerationHistory(localStorage, [])
      persistAnimationHistory(localStorage, [])
    } catch (e) {
      console.error('Failed to clear local AI history', e)
    }
  },
}))
