import { useMascotScene } from './useMascotScene.hook'

export const MascotScene = () => {
  const { canvasRef, containerRef } = useMascotScene()

  return (
    <div className="relative flex w-full flex-col items-center">
      <div ref={containerRef} className="flex w-[80%] max-w-[720px] items-center justify-center">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="PixelForge mascot shooting pixel enemies"
          className="pixel-scene-fade h-auto max-w-full"
        />
      </div>
    </div>
  )
}
