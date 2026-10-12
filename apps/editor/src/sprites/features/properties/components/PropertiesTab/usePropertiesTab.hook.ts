import { useCallback } from 'react'

import {
  useActiveLayerId,
  useActiveLayerOpacity,
  useCursorPixel,
  useSetLayerOpacity,
} from '@/sprites/hooks/useSpriteEditorStore.hook'

export const usePropertiesTab = () => {
  const cursorPixel = useCursorPixel()

  const activeLayerId = useActiveLayerId()
  const activeLayerOpacity = useActiveLayerOpacity()
  const setLayerOpacity = useSetLayerOpacity()
  const handleOpacityChange = useCallback(
    (value: number) => setLayerOpacity(activeLayerId, value),
    [activeLayerId, setLayerOpacity],
  )

  return {
    cursorPixel,
    activeLayerOpacity,
    handleOpacityChange,
  }
}
