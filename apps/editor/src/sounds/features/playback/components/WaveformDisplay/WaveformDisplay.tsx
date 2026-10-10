'use client'

import { useWaveformDisplay } from './useWaveformDisplay.hook'

export function WaveformDisplay() {
  const { canvasRef, containerRef, handleCanvasClick, canvasHeight } = useWaveformDisplay()

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden rounded-lg bg-gray-900"
    >
      <canvas
        ref={canvasRef}
        height={canvasHeight}
        onClick={handleCanvasClick}
        aria-label="Audio waveform display. Click to seek playback position."
        className="block w-full cursor-crosshair"
      />
    </div>
  )
}
