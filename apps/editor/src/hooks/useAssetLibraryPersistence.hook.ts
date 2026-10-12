import { useEffect, useRef } from 'react'

import { useAssetsStore } from '@/stores/assets.store'
import { createIndexedDbAssetLibraryRepository } from '@/services/indexeddb-asset-library.repository.service'

/**
 * Moves the Assets library onto IndexedDB once per session. If IndexedDB
 * can't open (private browsing, disabled storage) the store keeps using its
 * localStorage fallback — nothing breaks, the library just stays small.
 */
export function useAssetLibraryPersistence(): void {
  const hydrate = useAssetsStore((s) => s.hydrate)
  // One attempt per mount: a failure resets `repository` to null, which must
  // not re-trigger hydration in a loop.
  const attemptedRef = useRef(false)

  useEffect(() => {
    if (attemptedRef.current || useAssetsStore.getState().repository) return
    attemptedRef.current = true
    hydrate(createIndexedDbAssetLibraryRepository()).catch((e) => {
      console.error('IndexedDB unavailable — assets stay in localStorage this session.', e)
      useAssetsStore.setState({ repository: null })
    })
  }, [hydrate])
}
