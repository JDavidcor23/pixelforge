import { useEffect, useRef } from 'react'

import { useAuthStore } from '@/stores/auth.store'
import { useSoundsStore } from '@/stores/sounds.store'
import { listAudioAssets } from '@/sounds/features/library/services/audio-storage.service'
import { dropListedSounds } from '@/sounds/features/library/services/drop-listed-sounds'
import { hydrateListedSounds } from '@/sounds/features/library/services/hydrate-listed-sounds.service'
import { mergeListedSounds } from '@/sounds/features/library/services/merge-listed-sounds'

/**
 * Keeps the sounds library in sync with the signed-in user's bucket. Mounted
 * in `EditorLayout` (stays mounted across /sprites, /sounds, /build), so route
 * changes never refetch. Per user: list once and merge (session wins, applied
 * inside `setState` so sounds added in flight survive). When the user signs
 * out or changes, the previous user's listed sounds are dropped (session-created
 * ones stay), and a listing still in flight for the old user is discarded.
 */
export function useSoundLibraryHydration(): void {
  const userId = useAuthStore((s) => s.user?.id ?? null)
  const activeUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (activeUserIdRef.current === userId) return
    if (activeUserIdRef.current !== null) {
      useSoundsStore.setState((state) => {
        const assets = dropListedSounds(state.assets)
        return assets === state.assets ? state : { assets }
      })
    }
    activeUserIdRef.current = userId
    if (!userId) return
    void hydrateListedSounds({
      userId,
      listAssets: listAudioAssets,
      isCurrent: () => activeUserIdRef.current === userId,
      applyListed: (listed) =>
        useSoundsStore.setState((state) => {
          const assets = mergeListedSounds(state.assets, listed)
          return assets === state.assets ? state : { assets }
        }),
    })
  }, [userId])
}
