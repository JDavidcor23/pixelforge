import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useSoundsStore } from '@/stores/sounds.store'
import { useSoundEditorView } from '@/sounds/hooks/useSoundEditorView.hook'
import { openSoundDeepLink, readAssetDeepLinkId, withoutAssetDeepLink } from '@/services/asset-deep-link.service'

/**
 * `/sounds?asset=<id>` selects that sound and opens the sound view. The sound
 * library is session-only, so after a reload the id is unknown: that is
 * silent (timeline stays). Each id is handled once and the param is removed
 * (replace) either way.
 */
export function useSoundAssetDeepLink(): void {
  const [searchParams, setSearchParams] = useSearchParams()
  const { openSound } = useSoundEditorView()
  const assetId = readAssetDeepLinkId(searchParams)
  const handledIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!assetId || handledIdRef.current === assetId) return
    handledIdRef.current = assetId
    const knownIds = useSoundsStore.getState().assets.map((asset) => asset.id)
    openSoundDeepLink(assetId, { knownIds, openSound })
    setSearchParams(withoutAssetDeepLink, { replace: true })
  }, [assetId, openSound, setSearchParams])
}
