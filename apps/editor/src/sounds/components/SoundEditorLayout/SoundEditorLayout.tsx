import { ArrowLeft, AudioLines } from 'lucide-react'

import { SoundDetail } from '@/sounds/features/detail'
import { DeleteSoundDialog, LibrarySidebar } from '@/sounds/features/library'
import { TimelineEditor } from '@/sounds/features/timeline'
import { useSoundEditorLayout } from './useSoundEditorLayout.hook'
import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'

export function SoundEditorLayout() {
  const { showAudioOverlay, isTimelineView, handleEnableAudio, handleBackToTimeline } =
    useSoundEditorLayout()

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-sunken text-ink">
      {showAudioOverlay && (
        <button
          type="button"
          onClick={handleEnableAudio}
          className={`absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-sunken/90 backdrop-blur-sm ${FOCUS_RING.INSET}`}
        >
          <AudioLines className="size-12 text-accent" aria-hidden />
          <span className="text-base font-medium text-ink">Click to enable audio</span>
          <span className="text-xs text-muted">
            Your browser needs one click before it can play sound.
          </span>
        </button>
      )}

      <LibrarySidebar />
      {isTimelineView ? (
        <TimelineEditor />
      ) : (
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="shrink-0 px-6 pt-4">
            <button
              type="button"
              onClick={handleBackToTimeline}
              className={`flex items-center gap-1.5 rounded px-2 py-1 text-xs text-muted hover:bg-hover hover:text-ink ${MOTION.COLORS} ${FOCUS_RING.BASE}`}
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              Back to timeline
            </button>
          </div>
          <SoundDetail />
        </div>
      )}
      <DeleteSoundDialog />
    </div>
  )
}
