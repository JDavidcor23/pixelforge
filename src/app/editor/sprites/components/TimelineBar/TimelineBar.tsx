'use client'

import { Play, Pause, Plus } from 'lucide-react'

import { SPRITE_EDITOR_TIMELINE } from '@/app/editor/constants'
import { FrameThumbnail } from '../FrameThumbnail/FrameThumbnail'
import { useTimelineBar } from './useTimelineBar.hook'

export const TimelineBar = () => {
  const {
    timeline,
    handleFpsChange,
    handleAddFrame,
    handleSelectFrame,
    handleTogglePlayback,
  } = useTimelineBar()

  const PlaybackIcon = timeline.isPlaying ? Pause : Play

  return (
    <div className="flex h-24 items-center border-t border-white/10 bg-[#0f1115] px-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleTogglePlayback}
          className="rounded p-2 text-[#8888aa] transition-colors hover:text-[#00f5ff]"
        >
          <PlaybackIcon size={16} />
        </button>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={timeline.fps}
            min={SPRITE_EDITOR_TIMELINE.MIN_FPS}
            max={SPRITE_EDITOR_TIMELINE.MAX_FPS}
            onChange={handleFpsChange}
            className="w-12 rounded border border-white/10 bg-[#1a1a2e] px-1 py-0.5 text-center text-xs text-[#ededed]"
          />
          <span className="text-[10px] text-[#8888aa]">FPS</span>
        </div>
      </div>

      <div className="mx-4 h-8 w-px bg-white/10" />

      <div className="flex flex-1 items-center gap-2 overflow-x-auto">
        {timeline.frames.map((frame, index) => (
          <FrameThumbnail
            key={frame.id}
            frameIndex={index}
            isActive={index === timeline.currentFrameIndex}
            onSelect={handleSelectFrame}
          />
        ))}
      </div>

      <div className="mx-4 h-8 w-px bg-white/10" />

      <button
        type="button"
        onClick={handleAddFrame}
        className="rounded p-2 text-[#8888aa] transition-colors hover:text-[#00f5ff]"
      >
        <Plus size={16} />
      </button>
    </div>
  )
}

