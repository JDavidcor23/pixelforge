'use client'

import { useRef } from 'react'

import { useCanvasRenderer } from '../../hooks/useCanvasRenderer.hook'
import { useCanvasInteraction } from '../../hooks/useCanvasInteraction.hook'
import { useCanvasZoom } from '../../hooks/useCanvasZoom.hook'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts.hook'

export const useCanvasArea = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const { canvasElementWidth, canvasElementHeight } = useCanvasRenderer(canvasRef)
  const { handlePointerDown, handlePointerMove, handlePointerUp, handlePointerLeave } =
    useCanvasInteraction()
  const { handleWheel } = useCanvasZoom()

  useKeyboardShortcuts()

  return {
    canvasRef,
    canvasElementWidth,
    canvasElementHeight,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerLeave,
    handleWheel,
  }
}

