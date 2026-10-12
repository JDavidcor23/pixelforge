import { useCallback, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'

import { PANEL_RESIZE_STEP, PANEL_RESIZE_STEP_LARGE } from '@/constants'

export interface UseResizeHandleParams {
  /** `'x'` for a vertical line (col-resize, drag left/right rails). `'y'` for a horizontal line (row-resize, bottom panel). */
  readonly axis: 'x' | 'y'
  /**
   * `false` when moving the pointer in the positive axis direction GROWS the
   * panel (left rail — handle on its right edge). `true` when it SHRINKS the
   * panel instead (right inspector and bottom panel — their handle sits on
   * the edge closest to the canvas, so moving toward the canvas eats space).
   */
  readonly invert: boolean
  readonly size: number
  readonly min: number
  readonly max: number
  readonly defaultSize: number
  readonly onResize: (size: number) => void
  /** Lets the shell layout disable its grid-template transition for the duration of a drag so it tracks the pointer 1:1. */
  readonly onDragStart?: () => void
  readonly onDragEnd?: () => void
}

/** Pointer-capture drag + roving keyboard resize for a single panel edge (role="separator"). */
export const useResizeHandle = ({
  axis,
  invert,
  size,
  min,
  max,
  defaultSize,
  onResize,
  onDragStart,
  onDragEnd,
}: UseResizeHandleParams) => {
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ pointer: 0, size: 0 })

  const clamp = useCallback((value: number) => Math.min(max, Math.max(min, value)), [min, max])

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.currentTarget.setPointerCapture(event.pointerId)
      dragStartRef.current = { pointer: axis === 'x' ? event.clientX : event.clientY, size }
      setIsDragging(true)
      onDragStart?.()
    },
    [axis, size, onDragStart],
  )

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
      const pointerPos = axis === 'x' ? event.clientX : event.clientY
      const rawDelta = pointerPos - dragStartRef.current.pointer
      const signedDelta = invert ? -rawDelta : rawDelta
      onResize(clamp(dragStartRef.current.size + signedDelta))
    },
    [axis, invert, clamp, onResize],
  )

  const handlePointerUp = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
      setIsDragging(false)
      onDragEnd?.()
    },
    [onDragEnd],
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const isForward = axis === 'x' ? event.key === 'ArrowRight' : event.key === 'ArrowDown'
      const isBackward = axis === 'x' ? event.key === 'ArrowLeft' : event.key === 'ArrowUp'
      if (!isForward && !isBackward) return

      event.preventDefault()
      const step = event.shiftKey ? PANEL_RESIZE_STEP_LARGE : PANEL_RESIZE_STEP
      const rawDelta = isForward ? step : -step
      const signedDelta = invert ? -rawDelta : rawDelta
      onResize(clamp(size + signedDelta))
    },
    [axis, invert, size, clamp, onResize],
  )

  const handleDoubleClick = useCallback(() => onResize(defaultSize), [defaultSize, onResize])

  return { isDragging, handlePointerDown, handlePointerMove, handlePointerUp, handleKeyDown, handleDoubleClick }
}
