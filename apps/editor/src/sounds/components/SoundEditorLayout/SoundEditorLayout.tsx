import { AudioLines } from 'lucide-react'

import { SoundDetail } from '@/sounds/features/detail'
import { DeleteSoundDialog, LibrarySidebar } from '@/sounds/features/library'
import { useSoundEditorLayout } from './useSoundEditorLayout.hook'
import { FOCUS_RING } from '@/constants/focus-ring'

export function SoundEditorLayout() {
  const { showAudioOverlay, handleEnableAudio } = useSoundEditorLayout()

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-base text-ink">
      {showAudioOverlay && (
        <button
          type="button"
          onClick={handleEnableAudio}
          className={`absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-base/90 backdrop-blur-sm ${FOCUS_RING.INSET}`}
        >
          <AudioLines className="size-12 text-accent" aria-hidden />
          <span className="text-base font-medium text-ink">Click to enable audio</span>
          <span className="text-xs text-muted">
            Your browser needs one click before it can play sound.
          </span>
        </button>
      )}

      <LibrarySidebar />
      <SoundDetail />
      <DeleteSoundDialog />
    </div>
  )
}
