'use client'

import { useRef, useCallback } from 'react'

import { screenToPixel, getPixel } from '@/app/editor/lib'
import { SPRITE_EDITOR_DEFAULTS } from '@/app/editor/constants'
import type { PixelCoord, SelectionState } from '@/app/editor/types'
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
  useSelection,
  useSetSelection,
  useCommitTransformation,
  useSetViewportOffset,
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
  const selection = useSelection()
  const setSelection = useSetSelection()
  const commitTransformation = useCommitTransformation()

  const isDrawing = useRef(false)
  const interactionMode = useRef<'IDLE' | 'SELECTING' | 'MOVING' | 'RESIZING' | 'PANNING'>('IDLE')
  const lastPixelCoord = useRef<PixelCoord | null>(null)
  const selectionStart = useRef<PixelCoord | null>(null)
  const initialSelectionRect = useRef<SelectionState['rect'] | null>(null)
  const panStart = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 })
  const setViewportOffset = useSetViewportOffset()

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
    (e: any) => {
      // Middle click or space+click panning
      if (e.evt.button === 1 || e.evt.code === 'Space') {
        interactionMode.current = 'PANNING'
        panStart.current = {
          x: e.evt.clientX,
          y: e.evt.clientY,
          offsetX: viewport.offsetX,
          offsetY: viewport.offsetY,
        }
        return
      }

      const coord = getPixelFromEvent(e)
      if (!coord) return

      if (activeTool === 'transform') {
        // Konva handles transformer and group dragging.
        // We might want to deselect if they click outside the transformer, 
        // but for now, switching tools commits the transform.
        return
      }

      if (activeTool === 'select') {
        interactionMode.current = 'SELECTING'
        selectionStart.current = coord
        setSelection({
          rect: { x: coord.x, y: coord.y, width: 1, height: 1 },
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          floatingPixels: null,
          originalArea: null,
        })
        return
      }

      isDrawing.current = true
      lastPixelCoord.current = coord
      applyToolAtPixel(coord)
    },
    [getPixelFromEvent, applyToolAtPixel, activeTool, setSelection]
  )

  const handlePointerMove = useCallback(
    (e: any) => {
      if (interactionMode.current === 'PANNING') {
        const dx = e.evt.clientX - panStart.current.x
        const dy = e.evt.clientY - panStart.current.y
        setViewportOffset(
          panStart.current.offsetX + dx,
          panStart.current.offsetY + dy
        )
        return
      }

      const coord = getPixelFromEvent(e)
      setCursorPixel(coord)

      if (activeTool === 'select' && coord && selectionStart.current && interactionMode.current === 'SELECTING') {
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
          originalArea: null,
        })
        return
      }

      if (activeTool === 'transform') {
        return // handled by Konva Transformer
      }

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
    [getPixelFromEvent, setCursorPixel, activeTool, primaryColor, activeLayerId, setPixel, setSelection]
  )

  const handlePointerUp = useCallback(() => {
    if (interactionMode.current === 'PANNING') {
      interactionMode.current = 'IDLE'
      return
    }

    if (activeTool === 'select' || activeTool === 'transform') {
      interactionMode.current = 'IDLE'
      return
    }

    if (isDrawing.current) {
      pushHistory('Draw')
    }
    isDrawing.current = false
    lastPixelCoord.current = null
  }, [activeTool, pushHistory])

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

