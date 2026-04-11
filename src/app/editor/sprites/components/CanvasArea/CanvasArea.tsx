'use client'

import { useCanvasArea } from './useCanvasArea.hook'

export const CanvasArea = () => {
  const {
    canvasRef,
    canvasElementWidth,
    canvasElementHeight,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerLeave,
    handleWheel,
  } = useCanvasArea()

  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden">
      <canvas
        ref={canvasRef}
        width={canvasElementWidth}
        height={canvasElementHeight}
        style={{ width: canvasElementWidth, height: canvasElementHeight }}
        className="cursor-crosshair"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onWheel={handleWheel}
      />
    </div>
  )
}

