import { useRef, useCallback, MutableRefObject } from 'react'
import type { KonvaEventObject } from 'konva/lib/Node'
import { useViewport, useSetViewportOffset } from '@/sprites/hooks/useSpriteEditorStore.hook'

// Matches `useCanvasInteraction.hook.ts`'s `KonvaPointerEvent` exactly —
// `startPanning`/`doPanning` are called from that hook's unified pointer
// handlers, which receive this union type regardless of which tool/gesture
// is active. In practice panning is only ever entered via a middle-click or
// space+drag (a `MouseEvent`, checked at the call site), never a touch
// event, so `e.evt` is cast to `MouseEvent` here — the same established
// pattern `handlePointerDown`'s own `evt.button`/`evt.code` check already
// uses for this exact union type.
type KonvaPointerEvent = KonvaEventObject<MouseEvent | TouchEvent>

export const useCanvasPanning = (interactionMode: MutableRefObject<'IDLE' | 'SELECTING' | 'MOVING' | 'RESIZING' | 'PANNING'>) => {
  const panStart = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 })
  const setViewportOffset = useSetViewportOffset()
  const viewport = useViewport()

  const startPanning = useCallback((e: KonvaPointerEvent) => {
    const evt = e.evt as MouseEvent
    interactionMode.current = 'PANNING'
    panStart.current = {
      x: evt.clientX,
      y: evt.clientY,
      offsetX: viewport.offsetX,
      offsetY: viewport.offsetY,
    }
  }, [viewport.offsetX, viewport.offsetY, interactionMode])

  const doPanning = useCallback((e: KonvaPointerEvent) => {
    if (interactionMode.current !== 'PANNING') return
    const evt = e.evt as MouseEvent
    const dx = evt.clientX - panStart.current.x
    const dy = evt.clientY - panStart.current.y
    setViewportOffset(
      panStart.current.offsetX + dx,
      panStart.current.offsetY + dy
    )
  }, [setViewportOffset, interactionMode])

  const endPanning = useCallback(() => {
    interactionMode.current = 'IDLE'
  }, [interactionMode])

  return { startPanning, doPanning, endPanning }
}
