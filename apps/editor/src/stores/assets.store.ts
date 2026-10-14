import { create } from 'zustand'

import { ANIMATION_HISTORY_STORAGE_KEY, GENERATION_HISTORY_STORAGE_KEY } from '@/constants'
import { ASSET_LIBRARY_LIMIT } from '@/constants/persistence'
import { parseAnimationHistory, persistAnimationHistory } from '@/lib/animation-history'
import { parseGenerationHistory, persistGenerationHistory } from '@/lib/generation-history'
import type { AIAnimation, AIGeneration, AssetLibraryRepository } from '@/types'

/**
 * Shared Assets library (Sprite Studio v2): sprite generations and
 * animations produced from the Create/Animate tabs, read by both those tabs
 * and the bottom panel's Assets tab.
 *
 * Storage: IndexedDB (`AssetLibraryRepository`, up to `ASSET_LIBRARY_LIMIT`
 * per kind) once `hydrate` runs. Until then — or if IndexedDB can't open —
 * it falls back to the legacy localStorage history (raw arrays under
 * `GENERATION_HISTORY_STORAGE_KEY` / `ANIMATION_HISTORY_STORAGE_KEY`, 10
 * entries, ~5 MB quota). `hydrate` migrates that legacy history into
 * IndexedDB once and then removes the localStorage keys.
 */
export interface AssetsState {
  readonly generations: AIGeneration[]
  readonly animations: AIAnimation[]
  /** `null` until `hydrate` succeeds — writes go to localStorage meanwhile. */
  readonly repository: AssetLibraryRepository | null
  addGeneration: (generation: Omit<AIGeneration, 'id' | 'timestamp'>) => AIGeneration
  addAnimation: (animation: AIAnimation) => void
  /** Removes one generation from the library (Recent strip + Assets tab) and its IndexedDB/localStorage copy. */
  removeGeneration: (id: string) => void
  /** Removes one animation from the library (Recent strip + Assets tab) and its IndexedDB/localStorage copy. */
  removeAnimation: (id: string) => void
  /** Loads the library from `repository`, migrating the legacy localStorage history into it. */
  hydrate: (repository: AssetLibraryRepository) => Promise<void>
  /** Account deletion's "also delete what's saved in this browser" checkbox — wipes the AI generation/animation history and its browser storage. */
  clearLocalHistory: () => void
}

interface LibraryEntry {
  readonly id: string
  readonly timestamp: number
}

const readStorage = (key: string): string | null => {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(key)
}

/** Union by id (first occurrence wins), newest first. */
const mergeNewest = <T extends LibraryEntry>(...lists: readonly (readonly T[])[]): T[] => {
  const byId = new Map<string, T>()
  for (const entry of lists.flat()) if (!byId.has(entry.id)) byId.set(entry.id, entry)
  return [...byId.values()].sort((a, b) => b.timestamp - a.timestamp)
}

const evictedIds = <T extends LibraryEntry>(entries: readonly T[]): string[] =>
  entries.slice(ASSET_LIBRARY_LIMIT).map((entry) => entry.id)

const reportWriteError = (what: string) => (e: unknown) => console.error(`Failed to save ${what}`, e)
const reportDeleteError = (what: string) => (e: unknown) => console.error(`Failed to delete ${what}`, e)

const initialGenerations = parseGenerationHistory(readStorage(GENERATION_HISTORY_STORAGE_KEY)).generations
const initialAnimations = parseAnimationHistory(readStorage(ANIMATION_HISTORY_STORAGE_KEY)).animations

export const useAssetsStore = create<AssetsState>((set, get) => ({
  generations: initialGenerations,
  animations: initialAnimations,
  repository: null,

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

    const all = [next, ...get().generations]
    const { repository } = get()

    if (repository) {
      set({ generations: all.slice(0, ASSET_LIBRARY_LIMIT) })
      repository
        .putGenerations([next])
        .then(() => repository.removeGenerations(evictedIds(all)))
        .catch(reportWriteError('generation'))
      return next
    }

    set({ generations: all })
    try {
      persistGenerationHistory(localStorage, all)
    } catch (e) {
      console.error('Failed to persist generation history', e)
    }
    return next
  },

  addAnimation: (animation) => {
    const all = [animation, ...get().animations]
    const { repository } = get()

    if (repository) {
      set({ animations: all.slice(0, ASSET_LIBRARY_LIMIT) })
      repository
        .putAnimations([animation])
        .then(() => repository.removeAnimations(evictedIds(all)))
        .catch(reportWriteError('animation'))
      return
    }

    set({ animations: all })
    try {
      persistAnimationHistory(localStorage, all)
    } catch (e) {
      console.error('Failed to persist animation history', e)
    }
  },

  removeGeneration: (id) => {
    const { repository, generations } = get()
    const next = generations.filter((g) => g.id !== id)
    set({ generations: next })

    if (repository) {
      repository.removeGenerations([id]).catch(reportDeleteError('generation'))
      return
    }

    try {
      persistGenerationHistory(localStorage, next)
    } catch (e) {
      console.error('Failed to persist generation history', e)
    }
  },

  removeAnimation: (id) => {
    const { repository, animations } = get()
    const next = animations.filter((a) => a.id !== id)
    set({ animations: next })

    if (repository) {
      repository.removeAnimations([id]).catch(reportDeleteError('animation'))
      return
    }

    try {
      persistAnimationHistory(localStorage, next)
    } catch (e) {
      console.error('Failed to persist animation history', e)
    }
  },

  hydrate: async (repository) => {
    // Attach first: anything generated while loading goes straight to IndexedDB.
    set({ repository })
    const stored = await repository.loadAll()

    // In-memory entries IndexedDB doesn't have yet: the legacy localStorage
    // history on first run, plus anything added before `loadAll` resolved.
    const { generations: current, animations: currentAnimations } = get()
    const storedGenerationIds = new Set(stored.generations.map((g) => g.id))
    const storedAnimationIds = new Set(stored.animations.map((a) => a.id))
    await repository.putGenerations(current.filter((g) => !storedGenerationIds.has(g.id)))
    await repository.putAnimations(currentAnimations.filter((a) => !storedAnimationIds.has(a.id)))

    const generations = mergeNewest(get().generations, stored.generations)
    const animations = mergeNewest(get().animations, stored.animations)
    await repository.removeGenerations(evictedIds(generations))
    await repository.removeAnimations(evictedIds(animations))

    set({
      generations: generations.slice(0, ASSET_LIBRARY_LIMIT),
      animations: animations.slice(0, ASSET_LIBRARY_LIMIT),
    })

    // Only drop the legacy copy once IndexedDB holds it.
    if (typeof localStorage !== 'undefined') {
      persistGenerationHistory(localStorage, [])
      persistAnimationHistory(localStorage, [])
    }
  },

  clearLocalHistory: () => {
    const { repository } = get()
    set({ generations: [], animations: [] })
    repository?.clear().catch(reportWriteError('cleared library'))
    try {
      persistGenerationHistory(localStorage, [])
      persistAnimationHistory(localStorage, [])
    } catch (e) {
      console.error('Failed to clear local AI history', e)
    }
  },
}))
