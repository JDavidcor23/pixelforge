import { memo } from 'react'
import { Headphones, Pencil, Volume2, VolumeX } from 'lucide-react'

import { TweakSlider } from '@/sounds/features/synthesizer'
import { useTrackHeader } from './useTrackHeader.hook'
import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'
import type { TimelineTrack } from '@/types/timeline'

interface TrackHeaderProps {
  track: TimelineTrack
}

const TOGGLE = `flex size-6 shrink-0 items-center justify-center rounded border border-line text-subtle hover:bg-hover hover:text-ink aria-pressed:border-accent/25 aria-pressed:bg-hover aria-pressed:text-accent ${MOTION.PRESS} ${FOCUS_RING.RAISED}`

export const TrackHeader = memo(function TrackHeader({ track }: TrackHeaderProps) {
  const {
    KindIcon,
    iconClass,
    volumeRange,
    volumeValueText,
    handleToggleMute,
    handleToggleSolo,
    handleVolumeChange,
    handleSliderPointerDown,
    isRenaming,
    draftName,
    nameMaxLength,
    handleStartRename,
    handleDraftChange,
    handleRenameKeyDown,
    handleRenameFocus,
    handleRenameBlur,
  } = useTrackHeader(track)

  return (
    <div className="group/header sticky left-0 z-10 flex w-42 shrink-0 flex-col gap-2.5 border-r border-line bg-raised p-3">
      <div className="flex min-w-0 items-center gap-1.5">
        <KindIcon className={`size-3.25 shrink-0 ${iconClass}`} aria-hidden />
        {isRenaming ? (
          <input
            type="text"
            value={draftName}
            onChange={handleDraftChange}
            onKeyDown={handleRenameKeyDown}
            onFocus={handleRenameFocus}
            onBlur={handleRenameBlur}
            aria-label="Track name"
            maxLength={nameMaxLength}
            spellCheck={false}
            autoFocus
            className="min-w-0 flex-1 rounded border border-accent bg-sunken px-1 text-ui font-medium text-ink outline-none"
          />
        ) : (
          <span
            title={track.name}
            onDoubleClick={handleStartRename}
            className="cursor-text truncate text-ui font-medium text-ink group-data-muted:text-muted"
          >
            {track.name}
          </span>
        )}
        {!isRenaming && (
          <button
            type="button"
            onClick={handleStartRename}
            aria-label={`Rename ${track.name} track`}
            title="Rename track"
            className={`ml-auto shrink-0 rounded p-0.5 text-subtle opacity-0 group-hover/header:opacity-100 hover:text-accent focus-visible:opacity-100 ${MOTION.REVEAL} ${FOCUS_RING.RAISED}`}
          >
            <Pencil className="size-3" aria-hidden />
          </button>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleToggleMute}
          aria-pressed={track.muted}
          aria-label={`Mute ${track.name}`}
          title={`Mute ${track.name}`}
          className={TOGGLE}
        >
          {track.muted ? (
            <VolumeX className="size-3" aria-hidden />
          ) : (
            <Volume2 className="size-3" aria-hidden />
          )}
        </button>
        <button
          type="button"
          onClick={handleToggleSolo}
          aria-pressed={track.solo}
          aria-label={`Solo ${track.name}`}
          title={`Solo ${track.name}`}
          className={TOGGLE}
        >
          <Headphones className="size-3" aria-hidden />
        </button>
        <TweakSlider
          variant="track"
          ariaLabel={`${track.name} volume`}
          valueText={volumeValueText}
          value={track.volume}
          min={volumeRange.MIN}
          max={volumeRange.MAX}
          step={volumeRange.STEP}
          onChange={handleVolumeChange}
          onPointerDown={handleSliderPointerDown}
        />
      </div>
    </div>
  )
})
