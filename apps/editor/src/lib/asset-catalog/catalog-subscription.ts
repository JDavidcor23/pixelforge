import { useAssetCatalogStore } from '@/stores/asset-catalog.store'
import type { CatalogEntry } from '@/types/asset-catalog.types'

export type CatalogEntryListener = (entry: CatalogEntry | undefined) => void

/** Current catalog entry for `id`, or `undefined` when it does not exist. Outside React. */
export const getCatalogEntry = (id: string): CatalogEntry | undefined =>
  useAssetCatalogStore.getState().byId[id]

/**
 * Framework-free per-id subscription for Phaser (ADR 0016).
 *
 * Calls `listener` with the new entry (or `undefined` when removed) only when
 * THAT id's entry object changes: the catalog bumps `revision` by creating a new
 * entry and keeps the same reference for unchanged ones (structural sharing), so
 * edits to other ids and no-op re-derives never fire.
 *
 * It does NOT fire on subscribe: read the initial value with `getCatalogEntry(id)`.
 * Returns an unsubscribe function.
 */
export const subscribeToCatalogEntry = (id: string, listener: CatalogEntryListener): (() => void) => {
  let last = getCatalogEntry(id)
  return useAssetCatalogStore.subscribe((state) => {
    const next = state.byId[id]
    if (next === last) return
    last = next
    listener(next)
  })
}
