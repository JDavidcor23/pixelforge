import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useAssetsStore } from '@/stores/assets.store'
import { requestOpenAsset, waitForDocumentAssetCommands } from '@/services/document-asset-bus.service'
import { openSpriteDeepLink, readAssetDeepLinkId, withoutAssetDeepLink } from '@/services/asset-deep-link.service'

/**
 * `/sprites?asset=<id>` opens that sprite asset. Waits for the assets store to
 * hydrate and the persistence controller to register, handles each id once,
 * then removes the param (replace). An unknown id is silent: the editor keeps
 * whatever the controller restored.
 */
export function useSpriteAssetDeepLink(): void {
  const [searchParams, setSearchParams] = useSearchParams()
  const hydrated = useAssetsStore((state) => state.hydrated)
  const assetId = readAssetDeepLinkId(searchParams)
  const handledIdRef = useRef<string | null>(null)
  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!assetId || !hydrated || handledIdRef.current === assetId) return
    handledIdRef.current = assetId
    openSpriteDeepLink(assetId, { waitForCommands: waitForDocumentAssetCommands, openAsset: requestOpenAsset })
      .catch((error) => console.error('Failed to open the deep-linked sprite asset', error))
      .finally(() => {
        if (mountedRef.current) setSearchParams(withoutAssetDeepLink, { replace: true })
      })
  }, [assetId, hydrated, setSearchParams])
}
