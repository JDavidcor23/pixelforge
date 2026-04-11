'use client'

import { useEffect, useCallback, useState } from 'react'
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

  const [parentSize, setParentSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !canvas.parentElement) return

    const parent = canvas.parentElement
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setParentSize({
          width: Math.floor(entry.contentRect.width),
          height: Math.floor(entry.contentRect.height),
        })
      }
    })

    observer.observe(parent)
    setParentSize({
      width: Math.floor(parent.clientWidth),
      height: Math.floor(parent.clientHeight),
    })

    return () => observer.disconnect()
  }, [canvasRef])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || parentSize.width === 0 || parentSize.height === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    renderPixelGrid(
      ctx,
      layers,
      viewport,
      canvasDimensions.width,
      canvasDimensions.height,
      parentSize.width,
      parentSize.height
    )
  }, [layers, viewport, canvasDimensions, parentSize, canvasRef])

  useEffect(() => {
    const frameId = requestAnimationFrame(render)
    return () => cancelAnimationFrame(frameId)
  }, [render])

  return { canvasElementWidth: parentSize.width, canvasElementHeight: parentSize.height }
}

