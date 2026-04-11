'use client'

import { useEffect, useCallback } from 'react'
import type { RefObject } from 'react'

import { renderPixelGrid } from '@/app/editor/lib'
import {
  useLayers,
  useViewport,
  useCanvasDimensions,
} from './useSpriteEditorStore.hook'

export const useCanvasRenderer = (canvasRef: RefObject<HTMLCanvasElement | null>) => {
  const layers = useLayers()
  const viewport = useViewport()
  const canvasDimensions = useCanvasDimensions()

  const canvasElementWidth = canvasDimensions.width * viewport.zoom
  const canvasElementHeight = canvasDimensions.height * viewport.zoom

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    renderPixelGrid(
      ctx,
      layers,
      viewport,
      canvasDimensions.width,
      canvasDimensions.height,
      canvasElementWidth,
      canvasElementHeight
    )
  }, [layers, viewport, canvasDimensions, canvasElementWidth, canvasElementHeight, canvasRef])

  useEffect(() => {
    const frameId = requestAnimationFrame(render)
    return () => cancelAnimationFrame(frameId)
  }, [render])

  return { canvasElementWidth, canvasElementHeight }
}

