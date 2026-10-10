import { useRef, useCallback, useEffect } from 'react'
import type { KonvaEventObject } from 'konva/lib/Node'

import { screenToPixel, getPixel } from '@/lib'
import { SPRITE_EDITOR_DEFAULTS } from '@/constants'
import { packPoints, packRgba } from '@/lib/core/color-codec'
import type { PixelCoord } from '@/types'
import {
  useActiveTool,
  usePrimaryColor,
  useActiveLayerId,
  useViewport,
  useCanvasDimensions,
  useDispatch,
  useSetPrimaryColor,
  useSetCursorPixel,
  useIsStrokeOpen,
} from '@/sprites/hooks/useSpriteEditorStore.hook'
import { useSpriteEditorStore } from '@/stores'

import { useCanvasPanning } from './useCanvasPanning.hook'
import { useCanvasSelection } from './useCanvasSelection.hook'

const TRANSPARENT_COLOR = SPRITE_EDITOR_DEFAULTS.SECONDARY_COLOR

/**
 * The Konva stage is wired to BOTH mouse and touch DOM events with the same
 * handlers (`CanvasArea.tsx`'s `onMouseDown`/`onTouchStart` etc. both point
 * at `handlePointerDown`), so the underlying native event is a union, not a
 * single concrete event type. Phase 2c cleanup: replaces the `(e: any)`
 * these handlers used to take.
 */
type KonvaPointerEvent = KonvaEventObject<MouseEvent | TouchEvent>

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

/**
 * Pencil/eraser strokes and bucket fills are routed through `dispatch`
 * (phase 2, migrate-to-rust-core): a stroke is `stroke.begin` (pointer down)
 * -> one or more `stroke.points` batches (pointer down + every move) ->
 * `stroke.end` (pointer up/leave), which is what turns a whole dragged
 * stroke into exactly ONE dirty-rect undo entry — same UX as the old
 * "multiple setPixel calls, one pushHistory('Draw') on release" sequence,
 * just no longer a full-document snapshot. A bucket fill is a single atomic
 * `fill` command (immediate on pointer down) and does NOT get a
 * stroke.begin/end — it already produces its own history entry.
 */
export const useCanvasInteraction = () => {
  const activeTool = useActiveTool()
  const primaryColor = usePrimaryColor()
  const activeLayerId = useActiveLayerId()
  const viewport = useViewport()
  const canvasDimensions = useCanvasDimensions()

  const dispatch = useDispatch()
  const setPrimaryColor = useSetPrimaryColor()
  const setCursorPixel = useSetCursorPixel()
  const isStrokeOpen = useIsStrokeOpen()

  const isDrawing = useRef(false)
  const isStroking = useRef(false)
  const interactionMode = useRef<'IDLE' | 'SELECTING' | 'MOVING' | 'RESIZING' | 'PANNING'>('IDLE')
  const lastPixelCoord = useRef<PixelCoord | null>(null)

  const { startPanning, doPanning, endPanning } = useCanvasPanning(interactionMode)
  const { startSelection, doSelection, endSelection } = useCanvasSelection(interactionMode)

  // Judgment-day round 2 (finding 9): the core can end an open stroke from
  // OUTSIDE this hook's own pointer handlers — a mid-drag Ctrl+Z (undo),
  // a tool switch, or a frame switch all force-commit via
  // `lib/core/ts-core.ts`'s `endOpenStroke`. Without this, `isStroking`/
  // `isDrawing` would stay stuck "on" after such an external end, silently
  // no-op'ing the rest of the drag (every subsequent `stroke.points` is
  // ignored by the core since its own `strokeState` is already null, but
  // THIS hook would never notice and would never re-arm on the next
  // pointerdown's `stroke.begin` call either way — it still fires, but the
  // stale local flags could desync other branches). Mirroring the core's
  // own `isStrokeOpen` here keeps the two in lockstep regardless of WHO
  // closed the stroke.
  useEffect(() => {
    if (!isStrokeOpen) {
      isStroking.current = false
      isDrawing.current = false
      lastPixelCoord.current = null
    }
  }, [isStrokeOpen])

  const getPixelFromEvent = useCallback(
    (e: KonvaPointerEvent): PixelCoord | null => {
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
          dispatch({ type: 'stroke.points', points: packPoints([coord]), rgba: packRgba(primaryColor) })
          break
        case 'eraser':
          dispatch({ type: 'stroke.points', points: packPoints([coord]), rgba: packRgba(TRANSPARENT_COLOR) })
          break
        case 'bucket':
          dispatch({ type: 'fill', layerId: activeLayerId, x: coord.x, y: coord.y, rgba: packRgba(primaryColor), label: 'Draw' })
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
    [activeTool, activeLayerId, primaryColor, dispatch, setPrimaryColor]
  )

  const handlePointerDown = useCallback(
    (e: KonvaPointerEvent) => {
      // `code` is a KeyboardEvent property, never present on the
      // Mouse/TouchEvent this handler actually receives — kept as-is
      // (pre-existing, not a phase 2c change) to avoid altering behavior;
      // only the `any` cast this used to hide is removed.
      const evt = e.evt as MouseEvent & { code?: string }
      if (evt.button === 1 || evt.code === 'Space') {
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

      if (activeTool === 'pencil' || activeTool === 'eraser') {
        isStroking.current = true
        dispatch({ type: 'stroke.begin', layerId: activeLayerId })
      }

      applyToolAtPixel(coord)
    },
    [getPixelFromEvent, applyToolAtPixel, activeTool, activeLayerId, dispatch, startPanning, startSelection]
  )

  const handlePointerMove = useCallback(
    (e: KonvaPointerEvent) => {
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

        const linePixels = prev ? bresenhamLine(prev.x, prev.y, coord.x, coord.y) : [coord]
        dispatch({ type: 'stroke.points', points: packPoints(linePixels), rgba: packRgba(color) })
      }

      lastPixelCoord.current = coord
    },
    [getPixelFromEvent, setCursorPixel, activeTool, primaryColor, activeLayerId, dispatch, doPanning, doSelection]
  )

  const endStrokeIfActive = useCallback(() => {
    if (isStroking.current) {
      dispatch({ type: 'stroke.end', label: 'Draw' })
    }
    isStroking.current = false
    isDrawing.current = false
    lastPixelCoord.current = null
  }, [dispatch])

  const handlePointerUp = useCallback(() => {
    // "pointerup always ends the stroke regardless of current tool"
    // (phase 2c) — unconditional and idempotent (`endStrokeIfActive` is a
    // no-op when nothing is being drawn), so it runs before any of the
    // tool-specific branches below, instead of only in the `else` case.
    endStrokeIfActive()

    if (interactionMode.current === 'PANNING') {
      endPanning()
      return
    }

    if (activeTool === 'select' || activeTool === 'transform') {
      endSelection()
      return
    }
  }, [activeTool, endPanning, endSelection, endStrokeIfActive])

  const handlePointerLeave = useCallback(() => {
    setCursorPixel(null)
    endStrokeIfActive()
  }, [setCursorPixel, endStrokeIfActive])

  return { handlePointerDown, handlePointerMove, handlePointerUp, handlePointerLeave }
}
