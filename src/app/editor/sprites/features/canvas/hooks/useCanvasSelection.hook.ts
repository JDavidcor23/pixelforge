'use client'

import { useRef, useCallback, MutableRefObject } from 'react'
import type { PixelCoord } from '@/app/editor/types'
import { useSetSelection } from '@/app/editor/sprites/hooks/useSpriteEditorStore.hook'

export const useCanvasSelection = (interactionMode: MutableRefObject<'IDLE' | 'SELECTING' | 'MOVING' | 'RESIZING' | 'PANNING'>) => {
  const setSelection = useSetSelection()
  const selectionStart = useRef<PixelCoord | null>(null)

  const startSelection = useCallback((coord: PixelCoord) => {
    interactionMode.current = 'SELECTING'
    selectionStart.current = coord
    setSelection({
      rect: { x: coord.x, y: coord.y, width: 1, height: 1 },
      rotation: 0, 
      scaleX: 1, 
      scaleY: 1, 
      floatingPixels: null, 
      originalArea: null
    })
  }, [setSelection, interactionMode])

  const doSelection = useCallback((coord: PixelCoord) => {
    if (interactionMode.current !== 'SELECTING' || !selectionStart.current) return
    const start = selectionStart.current
    const x = Math.min(start.x, coord.x)
    const y = Math.min(start.y, coord.y)
    const width = Math.abs(coord.x - start.x) + 1
    const height = Math.abs(coord.y - start.y) + 1
    setSelection({
      rect: { x, y, width, height },
      rotation: 0, 
      scaleX: 1, 
      scaleY: 1, 
      floatingPixels: null, 
      originalArea: null
    })
  }, [setSelection, interactionMode])

  const endSelection = useCallback(() => {
    interactionMode.current = 'IDLE'
  }, [interactionMode])

  return { startSelection, doSelection, endSelection }
}
