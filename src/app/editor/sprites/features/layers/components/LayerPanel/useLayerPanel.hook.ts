'use client'

import { useCallback } from 'react'

import {
  useLayersMetadata,
  useActiveLayerId,
  useAddLayer,
  useToggleLayerVisibility,
  useToggleLayerLock,
  useSetActiveLayer,
  useUpdateLayerName,
  useReorderLayers,
} from '@/app/editor/sprites/hooks/useSpriteEditorStore.hook'

export const useLayerPanel = () => {
  const layersMetadata = useLayersMetadata()
  const activeLayerId = useActiveLayerId()
  const addLayer = useAddLayer()
  const toggleLayerVisibility = useToggleLayerVisibility()
  const toggleLayerLock = useToggleLayerLock()
  const updateLayerName = useUpdateLayerName()
  const reorderLayers = useReorderLayers()
  const setActiveLayer = useSetActiveLayer()

  const reversedLayers = [...layersMetadata].reverse()
  const handleUpdateLayerName = useCallback(
    (id: string, name: string) => {
      updateLayerName(id, name)
    },
    [updateLayerName]
  )

  const handleReorder = useCallback(
    (fromUiIndex: number, toUiIndex: number) => {
      const total = layersMetadata.length
      // Mapping top-down UI index to bottom-up Store index
      const fromStore = total - 1 - fromUiIndex
      const toStore = total - 1 - toUiIndex
      reorderLayers(fromStore, toStore)
    },
    [layersMetadata.length, reorderLayers]
  )

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
    handleUpdateLayerName,
    handleReorder,
  }
}
