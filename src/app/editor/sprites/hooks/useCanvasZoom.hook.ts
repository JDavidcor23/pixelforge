'use client'

import { useCallback } from 'react'

import { SPRITE_EDITOR_CANVAS, SPRITE_EDITOR_VIEWPORT } from '@/app/editor/constants'
import { useViewport, useSetZoom, useSetViewportOffset } from './useSpriteEditorStore.hook'

export const useCanvasZoom = () => {
  const viewport = useViewport()
  const setZoom = useSetZoom()
  const setViewportOffset = useSetViewportOffset()

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault()

      const zoomDelta = e.deltaY < 0 ? SPRITE_EDITOR_VIEWPORT.ZOOM_STEP : -SPRITE_EDITOR_VIEWPORT.ZOOM_STEP
      const newZoom = Math.min(
        SPRITE_EDITOR_CANVAS.MAX_ZOOM,
        Math.max(SPRITE_EDITOR_CANVAS.MIN_ZOOM, viewport.zoom + zoomDelta)
      )

      if (newZoom === viewport.zoom) return

      const rect = e.currentTarget.getBoundingClientRect()
      const cursorX = e.clientX - rect.left
      const cursorY = e.clientY - rect.top

      const scale = newZoom / viewport.zoom
      const newOffsetX = cursorX - (cursorX - viewport.offsetX) * scale
      const newOffsetY = cursorY - (cursorY - viewport.offsetY) * scale

      setZoom(newZoom)
      setViewportOffset(newOffsetX, newOffsetY)
    },
    [viewport, setZoom, setViewportOffset]
  )

  return { handleWheel }
}

