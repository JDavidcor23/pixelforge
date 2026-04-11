'use client'

import { useCallback } from 'react'

import {
  useLayers,
  useActiveLayerId,
  useAddLayer,
  useToggleLayerVisibility,
  useToggleLayerLock,
  useSetActiveLayer,
} from '@/app/editor/sprites/hooks/useSpriteEditorStore.hook'

export const useLayerPanel = () => {
  const layers = useLayers()
  const activeLayerId = useActiveLayerId()
  const addLayer = useAddLayer()
  const toggleLayerVisibility = useToggleLayerVisibility()
  const toggleLayerLock = useToggleLayerLock()
  const setActiveLayer = useSetActiveLayer()

  const reversedLayers = [...layers].reverse()

  const handleAddLayer = useCallback(() => {
    addLayer()
  }, [addLayer])

  const handleToggleVisibility = useCallback(
    (id: string) => {
      toggleLayerVisibility(id)
    },
    [toggleLayerVisibility]
  )

  const handleToggleLock = useCallback(
    (id: string) => {
      toggleLayerLock(id)
    },
    [toggleLayerLock]
  )

  const handleSelectLayer = useCallback(
    (id: string) => {
      setActiveLayer(id)
    },
    [setActiveLayer]
  )

  return {
    reversedLayers,
    activeLayerId,
    handleAddLayer,
    handleToggleVisibility,
    handleToggleLock,
    handleSelectLayer,
  }
}
