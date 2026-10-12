import { useCallback, useRef } from 'react'
import type { KeyboardEvent } from 'react'

import { ASSET_TYPES } from '@/constants'
import type { AssetType } from '@/types'

export interface UseAssetTypeSelectorParams {
  readonly onChange: (value: AssetType) => void
}

/** Roving-tabindex keyboard navigation for the asset-type radiogroup. */
export const useAssetTypeSelector = ({ onChange }: UseAssetTypeSelectorParams) => {
  const itemRefs = useRef<Partial<Record<AssetType, HTMLButtonElement | null>>>({})

  const registerRef = useCallback(
    (id: AssetType) => (el: HTMLButtonElement | null) => {
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
        ? (index + 1) % ASSET_TYPES.length
        : (index - 1 + ASSET_TYPES.length) % ASSET_TYPES.length
      const nextType = ASSET_TYPES[nextIndex].id
      onChange(nextType)
      itemRefs.current[nextType]?.focus()
    },
    [onChange],
  )

  return { options: ASSET_TYPES, registerRef, handleKeyDown }
}
