import { useCallback, useEffect, useRef } from 'react'

import {
  useCreateAssetType,
  useCreateQualityTier,
  useSetBottomPanelTab,
  useSetCreateAssetType,
  useSetCreateQualityTier,
  useToggleTimeline,
} from '@/sprites/hooks/useSpriteEditorStore.hook'
import { useAIJobsStore } from '@/stores/ai-jobs.store'
import { useEditorUIStore } from '@/stores/ui.store'
import { QUALITY_RECOMMENDATION_BY_ASSET_TYPE } from '@/constants'
import type { QualityTier } from '@/types'

/**
 * `assetType` lives in the UI store (not local state), not `CreateTab`'s own —
 * lifted out so the Animate tab reads/edits the same "what are you making?"
 * choice instead of drifting out of sync with it.
 *
 * `qualityTier`/`setQualityTier` moved here from `useGeneratePanel.hook.ts`
 * (Sprite Studio v3, S13) so `CreateTab` can render `QualitySelector` right
 * after the asset-type chips, ahead of `GeneratePanel`'s prompt/size/button —
 * it pairs naturally with `assetType` since switching asset type also resets
 * the recommended tier (see the effect below). `isLoading` is just a plain
 * store read (no owned logic), safe to select here too so `QualitySelector`
 * can be disabled mid-generation without `GeneratePanel` owning it.
 *
 * `handleViewAssets` opens the bottom panel's Assets tab, expanding it first
 * if collapsed — the same mechanism the old "See all in Assets" link used
 * (Sprite Studio v3: Create is AI-only now, so this lives at the tab level
 * instead of inside the Generate panel).
 */
export const useCreateTab = () => {
  const assetType = useCreateAssetType()
  const setAssetType = useSetCreateAssetType()
  const setBottomPanelTab = useSetBottomPanelTab()
  const toggleTimeline = useToggleTimeline()
  const timelineOpen = useEditorUIStore((s) => s.ui.timelineOpen)
  const isLoading = useAIJobsStore((s) => s.generate.isRunning)

  // Persisted the same way as `createAssetType` (see ui.store.ts) — survives a reload.
  const qualityTier = useCreateQualityTier()
  const setQualityTierStore = useSetCreateQualityTier()
  // Once the user explicitly picks a tier, their choice wins over the
  // per-asset-type recommendation (see the effect below) for the rest of the
  // session.
  const userPickedQualityRef = useRef(false)
  const setQualityTier = useCallback(
    (tier: QualityTier) => {
      userPickedQualityRef.current = true
      setQualityTierStore(tier)
    },
    [setQualityTierStore],
  )

  // Switching asset type re-applies that type's recommended tier — unless the
  // user already picked one themselves this session. Guarded by a
  // previous-asset-type ref (not just `[assetType]`) so a fresh mount never
  // clobbers a tier restored from persisted storage; it only reacts to an
  // actual in-session switch.
  const previousAssetTypeRef = useRef(assetType)
  useEffect(() => {
    if (previousAssetTypeRef.current === assetType) return
    previousAssetTypeRef.current = assetType
    if (userPickedQualityRef.current) return
    setQualityTierStore(QUALITY_RECOMMENDATION_BY_ASSET_TYPE[assetType].tier)
  }, [assetType, setQualityTierStore])

  const handleViewAssets = useCallback(() => {
    setBottomPanelTab('assets')
    if (!timelineOpen) toggleTimeline()
  }, [setBottomPanelTab, timelineOpen, toggleTimeline])

  return { assetType, setAssetType, qualityTier, setQualityTier, isLoading, handleViewAssets }
}
