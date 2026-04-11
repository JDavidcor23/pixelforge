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
    <div className="h-full w-full overflow-hidden bg-transparent">
      <canvas
        ref={canvasRef}
        width={canvasElementWidth}
        height={canvasElementHeight}
        style={{ width: '100%', height: '100%', touchAction: 'none' }}
        className="cursor-crosshair block"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onWheel={handleWheel}
      />
    </div>
  )
}

