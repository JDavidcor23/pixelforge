import { useEffect, useRef } from 'react'

import { createCanvas2DPixelWriter } from '@/lib/mascot/mascot-sprite'
import { drawMascotScene } from '@/lib/mascot/mascot-scene'
import { computeMascotSceneState, computeReducedMotionSceneState } from '@/lib/mascot/mascot-scene-state'
import { MASCOT_SCENE_SIZE } from '@/lib/mascot/mascot.constants'

const MIN_SCALE = 4
const MAX_SCALE = 10

export interface UseMascotSceneResult {
  readonly canvasRef: React.RefObject<HTMLCanvasElement | null>
  readonly containerRef: React.RefObject<HTMLDivElement | null>
}

/**
 * Drives the login-page mascot scene: an offscreen canvas is drawn at native
 * pixel-art resolution (`MASCOT_SCENE_SIZE`), then blitted onto the visible
 * canvas at an INTEGER scale with smoothing disabled, so the art stays crisp
 * at any column width (ResizeObserver, same pattern as the sprite canvas —
 * see `CanvasArea.tsx`). The 12 fps step, reduced-motion, tab-hidden and
 * offscreen pauses all live here; the drawing itself is pure
 * (`drawMascotScene`) and tested separately (`mascot-scene-state.test.ts`,
 * `mascot-sprite.test.ts`).
 */
export function useMascotScene(): UseMascotSceneResult {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const displayCtx = canvas.getContext('2d')
    if (!displayCtx) return

    const offscreen = document.createElement('canvas')
    offscreen.width = MASCOT_SCENE_SIZE.WIDTH
    offscreen.height = MASCOT_SCENE_SIZE.HEIGHT
    const offscreenCtx = offscreen.getContext('2d')
    if (!offscreenCtx) return
    offscreenCtx.imageSmoothingEnabled = false
    const writer = createCanvas2DPixelWriter(offscreenCtx)

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let scale = MIN_SCALE
    let isIntersecting = true
    let rafId: number | null = null
    let elapsedMs = 0
    let lastTimestamp: number | null = null

    const applyCanvasSize = () => {
      canvas.width = MASCOT_SCENE_SIZE.WIDTH * scale
      canvas.height = MASCOT_SCENE_SIZE.HEIGHT * scale
      displayCtx.imageSmoothingEnabled = false
    }

    const renderFrame = (state: ReturnType<typeof computeMascotSceneState>) => {
      offscreenCtx.clearRect(0, 0, MASCOT_SCENE_SIZE.WIDTH, MASCOT_SCENE_SIZE.HEIGHT)
      drawMascotScene(writer, state)
      displayCtx.clearRect(0, 0, canvas.width, canvas.height)
      displayCtx.drawImage(
        offscreen,
        0,
        0,
        MASCOT_SCENE_SIZE.WIDTH,
        MASCOT_SCENE_SIZE.HEIGHT,
        0,
        0,
        canvas.width,
        canvas.height,
      )
    }

    if (reducedMotion) {
      renderFrame(computeReducedMotionSceneState())
    } else {
      const tick = (timestamp: number) => {
        rafId = requestAnimationFrame(tick)
        if (document.visibilityState === 'hidden' || !isIntersecting) {
          lastTimestamp = null
          return
        }
        if (lastTimestamp !== null) elapsedMs += timestamp - lastTimestamp
        lastTimestamp = timestamp
        renderFrame(computeMascotSceneState(elapsedMs))
      }
      rafId = requestAnimationFrame(tick)
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const nextScale = Math.floor(entry.contentRect.width / MASCOT_SCENE_SIZE.WIDTH)
      scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale || MIN_SCALE))
      applyCanvasSize()
      if (reducedMotion) renderFrame(computeReducedMotionSceneState())
    })
    resizeObserver.observe(container)
    applyCanvasSize()

    const intersectionObserver = new IntersectionObserver((entries) => {
      isIntersecting = entries[0]?.isIntersecting ?? true
    })
    intersectionObserver.observe(canvas)

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mounted once; the scene owns its own animation lifecycle.
  }, [])

  return { canvasRef, containerRef }
}
