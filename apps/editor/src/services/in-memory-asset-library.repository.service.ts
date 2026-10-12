import type { AIAnimation, AIGeneration, AssetLibraryRepository } from '@/types'

const byNewest = <T extends { readonly timestamp: number }>(a: T, b: T): number => b.timestamp - a.timestamp

/** Same contract as the IndexedDB repository, kept in memory — for tests. */
export function createInMemoryAssetLibraryRepository(): AssetLibraryRepository {
  const generations = new Map<string, AIGeneration>()
  const animations = new Map<string, AIAnimation>()

  return {
    async loadAll() {
      return {
        generations: [...generations.values()].sort(byNewest),
        animations: [...animations.values()].sort(byNewest),
      }
    },
    async putGenerations(values) {
      values.forEach((value) => generations.set(value.id, value))
    },
    async putAnimations(values) {
      values.forEach((value) => animations.set(value.id, value))
    },
    async removeGenerations(ids) {
      ids.forEach((id) => generations.delete(id))
    },
    async removeAnimations(ids) {
      ids.forEach((id) => animations.delete(id))
    },
    async clear() {
      generations.clear()
      animations.clear()
    },
  }
}
