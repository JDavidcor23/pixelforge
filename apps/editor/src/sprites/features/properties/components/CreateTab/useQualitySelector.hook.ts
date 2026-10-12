import { useCallback, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'

import { ASSET_TYPES, QUALITY_RECOMMENDATION_BY_ASSET_TYPE, QUALITY_TIERS } from '@/constants'
import type { AssetType, QualityTier } from '@/types'

export interface UseQualitySelectorParams {
  readonly assetType: AssetType
  readonly onChange: (id: QualityTier) => void
}

/**
 * Roving-tabindex keyboard navigation for the quality radiogroup — mirrors
 * `useAssetTypeSelector.hook.ts`'s handler shape exactly. Also owns the
 * optional "Compare samples" dialog: open state plus the trigger ref the
 * dialog focuses back onto when it closes (same contract as
 * `useDeleteAccountDialog.hook.ts`'s `cancelRef`), and resolves which tile
 * gets the "Recommended" tag for the current asset type
 * (`QUALITY_RECOMMENDATION_BY_ASSET_TYPE`) plus the hint line explaining why.
 */
export const useQualitySelector = ({ assetType, onChange }: UseQualitySelectorParams) => {
  const itemRefs = useRef<Partial<Record<QualityTier, HTMLButtonElement | null>>>({})
  const compareTriggerRef = useRef<HTMLButtonElement | null>(null)
  const [isCompareOpen, setIsCompareOpen] = useState(false)

  const registerRef = useCallback(
    (id: QualityTier) => (el: HTMLButtonElement | null) => {
      itemRefs.current[id] = el
    },
    [],
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      const isNext = event.key === 'ArrowRight' || event.key === 'ArrowDown'
      const isPrev = event.key === 'ArrowLeft' || event.key === 'ArrowUp'
      if (!isNext && !isPrev) return

      event.preventDefault()
      const nextIndex = isNext
        ? (index + 1) % QUALITY_TIERS.length
        : (index - 1 + QUALITY_TIERS.length) % QUALITY_TIERS.length
      const nextTier = QUALITY_TIERS[nextIndex].id
      onChange(nextTier)
      itemRefs.current[nextTier]?.focus()
    },
    [onChange],
  )

  const handleOpenCompare = useCallback(() => setIsCompareOpen(true), [])

  const handleCloseCompare = useCallback(() => {
    setIsCompareOpen(false)
    compareTriggerRef.current?.focus()
  }, [])

  const recommendation = QUALITY_RECOMMENDATION_BY_ASSET_TYPE[assetType]

  // All current asset-type labels ("Character", "Object"…) pluralize with a
  // plain trailing "s" — revisit this if an irregular one is ever added.
  const recommendationHint = useMemo(() => {
    const assetTypeLabel = ASSET_TYPES.find((type) => type.id === assetType)?.label ?? assetType
    return `Recommended for ${assetTypeLabel.toLowerCase()}s: ${recommendation.reason}`
  }, [assetType, recommendation.reason])

  return {
    tiers: QUALITY_TIERS,
    registerRef,
    handleKeyDown,
    compareTriggerRef,
    isCompareOpen,
    handleOpenCompare,
    handleCloseCompare,
    recommendedTier: recommendation.tier,
    recommendationHint,
  }
}
