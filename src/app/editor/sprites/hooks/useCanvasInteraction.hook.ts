'use client'

import { useRef, useCallback } from 'react'

import { screenToPixel, getPixel } from '@/app/editor/lib'
import { SPRITE_EDITOR_DEFAULTS } from '@/app/editor/constants'
import type { PixelCoord } from '@/app/editor/types'
import {
  useActiveTool,
  usePrimaryColor,
  useActiveLayerId,
  useViewport,
  useCanvasDimensions,
  useLayers,
  useSetPixel,
  useFloodFill,
  useSetPrimaryColor,
  useSetCursorPixel,
  usePushHistory,
} from './useSpriteEditorStore.hook'

const TRANSPARENT_COLOR = SPRITE_EDITOR_DEFAULTS.SECONDARY_COLOR

function bresenhamLine(
  x0: number,
  y0: number,
  x1: number,
  y1: number
): PixelCoord[] {
  const points: PixelCoord[] = []
  const dx = Math.abs(x1 - x0)
  const dy = Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx - dy
  let cx = x0
  let cy = y0

  while (true) {
    points.push({ x: cx, y: cy })
    if (cx === x1 && cy === y1) break
    const e2 = 2 * err
    if (e2 > -dy) {
      err -= dy
      cx += sx
    }
    if (e2 < dx) {
      err += dx
      cy += sy
    }
  }

  return points
}

export const useCanvasInteraction = () => {
  const activeTool = useActiveTool()
  const primaryColor = usePrimaryColor()
  const activeLayerId = useActiveLayerId()
  const viewport = useViewport()
  const canvasDimensions = useCanvasDimensions()
  const layers = useLayers()

  const setPixel = useSetPixel()
  const floodFill = useFloodFill()
  const setPrimaryColor = useSetPrimaryColor()
  const setCursorPixel = useSetCursorPixel()
  const pushHistory = usePushHistory()

  const isDrawing = useRef(false)
  const lastPixelCoord = useRef<PixelCoord | null>(null)

  const getPixelFromEvent = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>): PixelCoord | null => {
      const rect = e.currentTarget.getBoundingClientRect()
      const screenX = e.clientX - rect.left
      const screenY = e.clientY - rect.top
      return screenToPixel(
        screenX,
        screenY,
        viewport,
        canvasDimensions.width,
        canvasDimensions.height,
        rect.width,
        rect.height
      )
    },
    [viewport, canvasDimensions]
  )

  const applyToolAtPixel = useCallback(
    (coord: PixelCoord) => {
      switch (activeTool) {
        case 'pencil':
          setPixel(activeLayerId, coord.x, coord.y, primaryColor)
          break
        case 'eraser':
          setPixel(activeLayerId, coord.x, coord.y, TRANSPARENT_COLOR)
          break
        case 'bucket':
          floodFill(activeLayerId, coord.x, coord.y, primaryColor)
          break
        case 'eyedropper': {
          const activeLayer = layers.find((l) => l.id === activeLayerId)
          if (activeLayer) {
            const pixelColor = getPixel(activeLayer.pixels, coord.x, coord.y)
            setPrimaryColor(pixelColor)
          }
          break
        }
      }
    },
    [activeTool, activeLayerId, primaryColor, layers, setPixel, floodFill, setPrimaryColor]
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const coord = getPixelFromEvent(e)
      if (!coord) return

      isDrawing.current = true
      lastPixelCoord.current = coord
      applyToolAtPixel(coord)
    },
    [getPixelFromEvent, applyToolAtPixel]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const coord = getPixelFromEvent(e)
      setCursorPixel(coord)

      if (!isDrawing.current || !coord) return

      if (activeTool === 'pencil' || activeTool === 'eraser') {
        const color = activeTool === 'pencil' ? primaryColor : TRANSPARENT_COLOR
        const prev = lastPixelCoord.current

        if (prev) {
          const linePixels = bresenhamLine(prev.x, prev.y, coord.x, coord.y)
          for (const point of linePixels) {
            setPixel(activeLayerId, point.x, point.y, color)
          }
        } else {
          setPixel(activeLayerId, coord.x, coord.y, color)
        }
      }

      lastPixelCoord.current = coord
    },
    [getPixelFromEvent, setCursorPixel, activeTool, primaryColor, activeLayerId, setPixel]
  )

  const handlePointerUp = useCallback(() => {
    if (isDrawing.current) {
      pushHistory('Draw')
    }
    isDrawing.current = false
    lastPixelCoord.current = null
  }, [pushHistory])

  const handlePointerLeave = useCallback(() => {
    setCursorPixel(null)
    if (isDrawing.current) {
      pushHistory('Draw')
    }
    isDrawing.current = false
    lastPixelCoord.current = null
  }, [setCursorPixel, pushHistory])

  return { handlePointerDown, handlePointerMove, handlePointerUp, handlePointerLeave }
}

