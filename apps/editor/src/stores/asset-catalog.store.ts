import { create } from 'zustand'

import { deriveAssetCatalog } from '@/lib/asset-catalog/derive-asset-catalog'
import type { AssetCatalog, CatalogEntry } from '@/types/asset-catalog.types'
import { useAssetsStore } from './assets.store'
import { useSoundsStore } from './sounds.store'

/**
 * Derived asset catalog (ADR 0016): never persisted, rebuilt in memory from
 * the sprite assets store and the sounds library and kept in sync by
 * subscription. Unchanged entries keep their reference (see `deriveAssetCatalog`).
 */
const compute = (previous?: AssetCatalog): AssetCatalog =>
  deriveAssetCatalog(useAssetsStore.getState().generations, useSoundsStore.getState().assets, previous)

export const useAssetCatalogStore = create<AssetCatalog>(() => compute())

const sync = (): void => {
  const current = useAssetCatalogStore.getState()
  const next = compute(current)
  if (next !== current) useAssetCatalogStore.setState(next, true)
}

useAssetsStore.subscribe(sync)
useSoundsStore.subscribe(sync)

export const selectCatalogIds = (state: AssetCatalog): readonly string[] => state.allIds

export const selectCatalogEntry =
  (id: string) =>
  (state: AssetCatalog): CatalogEntry | undefined =>
    state.byId[id]
