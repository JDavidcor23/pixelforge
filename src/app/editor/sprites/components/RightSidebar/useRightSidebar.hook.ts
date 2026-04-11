'use client'

import { useCallback } from 'react'

import {
  useCursorPixel,
  useActiveLayerId,
  useLayers,
  useSetLayerOpacity,
} from '../../hooks/useSpriteEditorStore.hook'

export const useRightSidebar = () => {
  const cursorPixel = useCursorPixel()
  const activeLayerId = useActiveLayerId()
  const layers = useLayers()
  const setLayerOpacity = useSetLayerOpacity()

  const activeLayer = layers.find((l) => l.id === activeLayerId)
  const activeLayerOpacity = activeLayer?.opacity ?? 100

  const handleOpacityChange = useCallback(
    (value: number) => {
      setLayerOpacity(activeLayerId, value)
    },
    [activeLayerId, setLayerOpacity]
  )

  return { cursorPixel, activeLayerOpacity, handleOpacityChange }
}

