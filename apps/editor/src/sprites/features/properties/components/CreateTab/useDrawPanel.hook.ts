import { useCallback } from 'react'

import { useAddLayer } from '@/sprites/hooks/useSpriteEditorStore.hook'

export const useDrawPanel = () => {
  const addLayer = useAddLayer()

  const handleAddBlankLayer = useCallback(() => addLayer(), [addLayer])

  return { handleAddBlankLayer }
}
