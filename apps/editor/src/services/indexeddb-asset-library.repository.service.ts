import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

import type { AIAnimation, AIGeneration, AssetLibraryRepository } from '@/types'
import {
  ASSET_ANIMATIONS_STORE,
  ASSET_DB_NAME,
  ASSET_DB_VERSION,
  ASSET_GENERATIONS_STORE,
} from '@/constants/persistence'

interface AssetLibraryDB extends DBSchema {
  [ASSET_GENERATIONS_STORE]: { key: string; value: AIGeneration }
  [ASSET_ANIMATIONS_STORE]: { key: string; value: AIAnimation }
}

type StoreName = typeof ASSET_GENERATIONS_STORE | typeof ASSET_ANIMATIONS_STORE

/** Newest first, matching the order the Assets panel shows. */
const byNewest = <T extends { readonly timestamp: number }>(a: T, b: T): number => b.timestamp - a.timestamp

/**
 * IndexedDB-backed Assets library. Images stay as the base64 strings the rest
 * of the editor already uses — the win over localStorage is the quota
 * (hundreds of MB instead of ~5 MB), not the encoding.
 */
export function createIndexedDbAssetLibraryRepository(): AssetLibraryRepository {
  const dbPromise: Promise<IDBPDatabase<AssetLibraryDB>> = openDB<AssetLibraryDB>(ASSET_DB_NAME, ASSET_DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(ASSET_GENERATIONS_STORE)) {
        db.createObjectStore(ASSET_GENERATIONS_STORE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(ASSET_ANIMATIONS_STORE)) {
        db.createObjectStore(ASSET_ANIMATIONS_STORE, { keyPath: 'id' })
      }
    },
  })

  const putAll = async <S extends StoreName>(store: S, values: readonly AssetLibraryDB[S]['value'][]) => {
    if (values.length === 0) return
    const db = await dbPromise
    const tx = db.transaction(store, 'readwrite')
    await Promise.all([...values.map((value) => tx.store.put(value)), tx.done])
  }

  const removeAll = async (store: StoreName, ids: readonly string[]) => {
    if (ids.length === 0) return
    const db = await dbPromise
    const tx = db.transaction(store, 'readwrite')
    await Promise.all([...ids.map((id) => tx.store.delete(id)), tx.done])
  }

  return {
    async loadAll() {
      const db = await dbPromise
      const [generations, animations] = await Promise.all([
        db.getAll(ASSET_GENERATIONS_STORE),
        db.getAll(ASSET_ANIMATIONS_STORE),
      ])
      return { generations: generations.sort(byNewest), animations: animations.sort(byNewest) }
    },
    putGenerations: (generations) => putAll(ASSET_GENERATIONS_STORE, generations),
    putAnimations: (animations) => putAll(ASSET_ANIMATIONS_STORE, animations),
    removeGenerations: (ids) => removeAll(ASSET_GENERATIONS_STORE, ids),
    removeAnimations: (ids) => removeAll(ASSET_ANIMATIONS_STORE, ids),
    async clear() {
      const db = await dbPromise
      await Promise.all([db.clear(ASSET_GENERATIONS_STORE), db.clear(ASSET_ANIMATIONS_STORE)])
    },
  }
}
