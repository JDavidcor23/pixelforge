import { useCallback } from 'react'

import {
  useActiveLayerId,
  useActiveLayerOpacity,
  useSetLayerOpacity,
} from '@/sprites/hooks/useSpriteEditorStore.hook'

interface UsePropertiesTabReturn {
  readonly activeLayerOpacity: number
  readonly handleOpacityChange: (value: number) => void
}

export const usePropertiesTab = (): UsePropertiesTabReturn => {
  const activeLayerId = useActiveLayerId()
  const activeLayerOpacity = useActiveLayerOpacity()
  const setLayerOpacity = useSetLayerOpacity()
  const handleOpacityChange = useCallback(
    (value: number) => setLayerOpacity(activeLayerId, value),
    [activeLayerId, setLayerOpacity],
  )

  return {
    activeLayerOpacity,
    handleOpacityChange,
  }
}
