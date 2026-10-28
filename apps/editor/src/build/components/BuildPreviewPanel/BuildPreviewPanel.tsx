import { PreviewToolbar } from '../PreviewToolbar/PreviewToolbar'
import { usePhaserGame } from '@/build/game/usePhaserGame.hook'

/**
 * The game mounts once into the container ref and never pushes state into React;
 * the toolbar owns its own `isPaused`, so this panel does not re-render while the game runs.
 */
export function BuildPreviewPanel() {
  const { containerRef } = usePhaserGame()

  return (
    <section className="flex min-w-0 flex-1 flex-col">
      <PreviewToolbar />
      <div ref={containerRef} className="relative min-h-0 flex-1 bg-sunken" />
    </section>
  )
}
