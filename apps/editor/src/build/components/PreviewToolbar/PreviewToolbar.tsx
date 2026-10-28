import { Maximize, Pause, Play, RotateCcw } from 'lucide-react'

import { usePreviewToolbar } from './usePreviewToolbar.hook'
import { BUILD_SCREEN_COPY } from '@/constants/build-screen'
import { FOCUS_RING } from '@/constants/focus-ring'

const TOOL_BUTTON = `flex size-6 items-center justify-center rounded-lg text-muted hover:text-accent ${FOCUS_RING.SURFACE}`

export function PreviewToolbar() {
  const { isPaused, playbackLabel, handleRestart, handleTogglePlayback, handleFullscreen } =
    usePreviewToolbar()

  return (
    <div className="flex h-9 shrink-0 items-center gap-2.5 bg-surface px-3">
      <span className="size-1.5 rounded-full bg-success" aria-hidden />
      <span className="font-mono text-2xs text-muted">{BUILD_SCREEN_COPY.PREVIEW_LIVE}</span>
      <div className="flex-1" />

      <button
        type="button"
        onClick={handleRestart}
        aria-label={BUILD_SCREEN_COPY.PREVIEW_RESTART}
        title={BUILD_SCREEN_COPY.PREVIEW_RESTART}
        className={TOOL_BUTTON}
      >
        <RotateCcw className="size-3.5" aria-hidden />
      </button>
      <button
        type="button"
        onClick={handleTogglePlayback}
        aria-label={playbackLabel}
        title={playbackLabel}
        className={TOOL_BUTTON}
      >
        {isPaused ? (
          <Play className="size-3.5" aria-hidden />
        ) : (
          <Pause className="size-3.5" aria-hidden />
        )}
      </button>
      <button
        type="button"
        onClick={handleFullscreen}
        aria-label={BUILD_SCREEN_COPY.PREVIEW_FULLSCREEN}
        title={BUILD_SCREEN_COPY.PREVIEW_FULLSCREEN}
        className={TOOL_BUTTON}
      >
        <Maximize className="size-3.5" aria-hidden />
      </button>
    </div>
  )
}
