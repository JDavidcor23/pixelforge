'use client'

import { useCallback } from 'react'

import { SPRITE_EDITOR_CANVAS, SPRITE_EDITOR_VIEWPORT } from '@/app/editor/constants'
import { useViewport, useSetZoom, useSetViewportOffset } from './useSpriteEditorStore.hook'

export const useCanvasZoom = () => {
  const viewport = useViewport()
  const setZoom = useSetZoom()
  const setViewportOffset = useSetViewportOffset()

  const handleWheel = useCallback(
    (e: any) => {
      e.evt.preventDefault()

      const zoomDelta = e.evt.deltaY < 0 ? SPRITE_EDITOR_VIEWPORT.ZOOM_STEP : -SPRITE_EDITOR_VIEWPORT.ZOOM_STEP
      const newZoom = Math.min(
        SPRITE_EDITOR_CANVAS.MAX_ZOOM,
        Math.max(SPRITE_EDITOR_CANVAS.MIN_ZOOM, viewport.zoom + zoomDelta)
      )

      if (newZoom === viewport.zoom) return

      const stage = e.target.getStage()
      if (!stage) return
      
      const pointerPosition = stage.getPointerPosition()
      if (!pointerPosition) return

      const cursorX = pointerPosition.x
      const cursorY = pointerPosition.y

      const scale = newZoom / viewport.zoom
      const canvasWidth = stage.width()
      const canvasHeight = stage.height()

      const newOffsetX = cursorX - (canvasWidth / 2) + ((canvasWidth / 2) + viewport.offsetX - cursorX) * scale
      const newOffsetY = cursorY - (canvasHeight / 2) + ((canvasHeight / 2) + viewport.offsetY - cursorY) * scale

      setZoom(newZoom)
      setViewportOffset(newOffsetX, newOffsetY)
    },
    [viewport, setZoom, setViewportOffset]
  )

  return { handleWheel }
}

