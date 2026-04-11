'use client'

import { useRef, useCallback, MutableRefObject } from 'react'
import { useViewport, useSetViewportOffset } from '@/app/editor/sprites/hooks/useSpriteEditorStore.hook'

export const useCanvasPanning = (interactionMode: MutableRefObject<'IDLE' | 'SELECTING' | 'MOVING' | 'RESIZING' | 'PANNING'>) => {
  const panStart = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 })
  const setViewportOffset = useSetViewportOffset()
  const viewport = useViewport()

  const startPanning = useCallback((e: any) => {
    interactionMode.current = 'PANNING'
    panStart.current = {
      x: e.evt.clientX,
      y: e.evt.clientY,
      offsetX: viewport.offsetX,
      offsetY: viewport.offsetY,
    }
  }, [viewport.offsetX, viewport.offsetY, interactionMode])

  const doPanning = useCallback((e: any) => {
    if (interactionMode.current !== 'PANNING') return
    const dx = e.evt.clientX - panStart.current.x
    const dy = e.evt.clientY - panStart.current.y
    setViewportOffset(
      panStart.current.offsetX + dx,
      panStart.current.offsetY + dy
    )
  }, [setViewportOffset, interactionMode])

  const endPanning = useCallback(() => {
    interactionMode.current = 'IDLE'
  }, [interactionMode])

  return { startPanning, doPanning, endPanning }
}
