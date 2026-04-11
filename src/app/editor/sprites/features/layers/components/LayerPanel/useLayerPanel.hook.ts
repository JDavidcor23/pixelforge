'use client'

import { useCallback } from 'react'

import {
  useLayersMetadata,
  useActiveLayerId,
  useAddLayer,
  useToggleLayerVisibility,
  useToggleLayerLock,
  useSetActiveLayer,
} from '@/app/editor/sprites/hooks/useSpriteEditorStore.hook'

export const useLayerPanel = () => {
  const layersMetadata = useLayersMetadata()
  const activeLayerId = useActiveLayerId()
  const addLayer = useAddLayer()
  const toggleLayerVisibility = useToggleLayerVisibility()
  const toggleLayerLock = useToggleLayerLock()
  const setActiveLayer = useSetActiveLayer()

  const reversedLayers = [...layersMetadata].reverse()

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
