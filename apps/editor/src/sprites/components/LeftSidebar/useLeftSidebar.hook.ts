import { useCallback } from 'react'

import { useAddLayer } from '@/sprites/hooks/useSpriteEditorStore.hook'

export const useLeftSidebar = () => {
  const addLayer = useAddLayer()

  const handleAddLayer = useCallback(() => addLayer(), [addLayer])

  return { handleAddLayer }
}
