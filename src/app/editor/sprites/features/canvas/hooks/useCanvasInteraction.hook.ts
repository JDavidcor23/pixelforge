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
  useSetPixel,
  useFloodFill,
  useSetPrimaryColor,
  useSetCursorPixel,
  usePushHistory,
} from '@/app/editor/sprites/hooks/useSpriteEditorStore.hook'
import { useSpriteEditorStore } from '@/app/editor/stores'

import { useCanvasPanning } from './useCanvasPanning.hook'
import { useCanvasSelection } from './useCanvasSelection.hook'

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

  const setPixel = useSetPixel()
  const floodFill = useFloodFill()
  const setPrimaryColor = useSetPrimaryColor()
  const setCursorPixel = useSetCursorPixel()
  const pushHistory = usePushHistory()

  const isDrawing = useRef(false)
  const interactionMode = useRef<'IDLE' | 'SELECTING' | 'MOVING' | 'RESIZING' | 'PANNING'>('IDLE')
  const lastPixelCoord = useRef<PixelCoord | null>(null)

  const { startPanning, doPanning, endPanning } = useCanvasPanning(interactionMode)
  const { startSelection, doSelection, endSelection } = useCanvasSelection(interactionMode)

  const getPixelFromEvent = useCallback(
    (e: any): PixelCoord | null => {
      const stage = e.target.getStage()
      if (!stage) return null
      
      const pos = stage.getPointerPosition()
      if (!pos) return null

      return screenToPixel(
        pos.x,
        pos.y,
        viewport,
        canvasDimensions.width,
        canvasDimensions.height,
        stage.width(),
        stage.height()
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
          const { layers } = useSpriteEditorStore.getState()
          const activeLayer = layers.find((l) => l.id === activeLayerId)
          if (activeLayer) {
            const pixelColor = getPixel(activeLayer.pixels, coord.x, coord.y)
            setPrimaryColor(pixelColor)
          }
          break
        }
      }
    },
    [activeTool, activeLayerId, primaryColor, setPixel, floodFill, setPrimaryColor]
  )

  const handlePointerDown = useCallback(
    (e: any) => {
      if (e.evt.button === 1 || e.evt.code === 'Space') {
        startPanning(e)
        return
      }

      const coord = getPixelFromEvent(e)
      if (!coord) return

      if (activeTool === 'transform') return
      if (activeTool === 'select') {
        startSelection(coord)
        return
      }

      isDrawing.current = true
      lastPixelCoord.current = coord
      applyToolAtPixel(coord)
    },
    [getPixelFromEvent, applyToolAtPixel, activeTool, startPanning, startSelection]
  )

  const handlePointerMove = useCallback(
    (e: any) => {
      if (interactionMode.current === 'PANNING') {
        doPanning(e)
        return
      }

      const coord = getPixelFromEvent(e)
      setCursorPixel(coord)

      if (activeTool === 'select' && coord && interactionMode.current === 'SELECTING') {
        doSelection(coord)
        return
      }

      if (activeTool === 'transform') return

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
    [getPixelFromEvent, setCursorPixel, activeTool, primaryColor, activeLayerId, setPixel, doPanning, doSelection]
  )

  const handlePointerUp = useCallback(() => {
    if (interactionMode.current === 'PANNING') {
      endPanning()
      return
    }

    if (activeTool === 'select' || activeTool === 'transform') {
      endSelection()
      return
    }

    if (isDrawing.current) {
      pushHistory('Draw')
    }
    isDrawing.current = false
    lastPixelCoord.current = null
  }, [activeTool, pushHistory, endPanning, endSelection])

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
