'use client'

import { Play, Pause, SkipBack, SkipForward, Plus, Repeat, Copy, ClipboardPaste, Clipboard } from 'lucide-react'

import { SPRITE_EDITOR_TIMELINE } from '@/app/editor/constants'
import { FrameThumbnail } from '../FrameThumbnail/FrameThumbnail'
import { useTimelineBar } from './useTimelineBar.hook'

export const TimelineBar = () => {
  const {
    timeline,
    frameClipboard,
    stripRef,
    dragRect,
    handleFpsChange,
    handleAddFrame,
    handleRemoveFrame,
    handleStripPointerDown,
    handleStripPointerMove,
    handleStripPointerUp,
    handleTogglePlayback,
    handleToggleLoop,
    handlePreviousFrame,
    handleNextFrame,
    handleCopyFrames,
    handlePasteFrames,
    handlePasteFramesAtEnd,
  } = useTimelineBar()

  const PlaybackIcon = timeline.isPlaying ? Pause : Play
  const totalFrames = timeline.frames.length

  return (
    <div className="flex h-24 cursor-default items-center border-t border-white/10 bg-[#0f1115] px-4">

      {/* Transport */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handlePreviousFrame}
          disabled={totalFrames <= 1}
          className="rounded p-2 text-[#8888aa] transition-colors hover:text-[#00f5ff] disabled:opacity-30 disabled:cursor-not-allowed"
          title="Previous frame"
        >
          <SkipBack size={16} />
        </button>
        <button
          type="button"
          onClick={handleTogglePlayback}
          className="rounded p-2 text-[#8888aa] transition-colors hover:text-[#00f5ff]"
          title={timeline.isPlaying ? 'Pause' : 'Play'}
        >
          <PlaybackIcon size={16} />
        </button>
        <button
          type="button"
          onClick={handleNextFrame}
          disabled={totalFrames <= 1}
          className="rounded p-2 text-[#8888aa] transition-colors hover:text-[#00f5ff] disabled:opacity-30 disabled:cursor-not-allowed"
          title="Next frame"
        >
          <SkipForward size={16} />
        </button>
      </div>

      <div className="mx-3 h-8 w-px bg-white/10" />

      {/* FPS */}
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={timeline.fps}
          min={SPRITE_EDITOR_TIMELINE.MIN_FPS}
          max={SPRITE_EDITOR_TIMELINE.MAX_FPS}
          onChange={handleFpsChange}
          className="w-12 rounded border border-white/10 bg-[#1a1a2e] px-1 py-0.5 text-center text-xs text-[#ededed]"
          title="Frames per second"
        />
        <span className="text-[10px] text-[#8888aa]">FPS</span>
      </div>

      <div className="mx-3 h-8 w-px bg-white/10" />

      {/* Frame strip — all interaction handled here, not on individual thumbnails */}
      <div
        ref={stripRef}
        className="relative flex flex-1 items-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20"
        style={{ userSelect: 'none' }}
        onPointerDown={handleStripPointerDown}
        onPointerMove={handleStripPointerMove}
        onPointerUp={handleStripPointerUp}
      >
        {/* Rubber band selection overlay */}
        {dragRect && dragRect.width > 6 && (
          <div
            className="pointer-events-none absolute top-1.5 bottom-1.5 z-10 rounded"
            style={{
              left: dragRect.left,
              width: dragRect.width,
              border: '2px dashed #00f5ff',
              backgroundColor: 'rgba(0, 245, 255, 0.06)',
              boxShadow: '0 0 12px rgba(0, 245, 255, 0.15) inset, 0 0 4px rgba(0, 245, 255, 0.1)',
            }}
          >
            {/* 8 anchor dots: corners + edge midpoints */}
            {[
              'top-0 left-0 -translate-x-1/2 -translate-y-1/2',
              'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2',
              'top-0 right-0 translate-x-1/2 -translate-y-1/2',
              'top-1/2 left-0 -translate-x-1/2 -translate-y-1/2',
              'top-1/2 right-0 translate-x-1/2 -translate-y-1/2',
              'bottom-0 left-0 -translate-x-1/2 translate-y-1/2',
              'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2',
              'bottom-0 right-0 translate-x-1/2 translate-y-1/2',
            ].map((pos) => (
              <span
                key={pos}
                className={`absolute h-2 w-2 rounded-full bg-[#00f5ff] shadow-[0_0_4px_#00f5ff] ${pos}`}
              />
            ))}
          </div>
        )}

        {/* Frame thumbnails — purely visual */}
        {timeline.frames.map((frame, index) => (
          <FrameThumbnail
            key={frame.id}
            frameIndex={index}
            isActive={index === timeline.currentFrameIndex}
            isSelected={timeline.selectedFrameIndices.includes(index)}
            isOnly={totalFrames === 1}
            onRemove={handleRemoveFrame}
          />
        ))}

        <button
          type="button"
          onClick={handleAddFrame}
          onPointerDown={(e) => e.stopPropagation()} // prevent strip drag
          className="flex-shrink-0 rounded p-2 text-[#8888aa] transition-colors hover:text-[#00f5ff]"
          title="Add frame"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="mx-3 h-8 w-px bg-white/10" />

      {/* Frame clipboard */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleCopyFrames}
          className="rounded p-2 text-[#8888aa] transition-colors hover:text-[#00f5ff]"
          title="Copy selected frames (Ctrl+C)"
        >
          <Copy size={16} />
        </button>
        <button
          type="button"
          onClick={handlePasteFrames}
          disabled={!frameClipboard}
          className={`rounded p-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
            frameClipboard
              ? 'text-[#7c3aed] hover:text-[#7c3aed]/80'
              : 'text-[#8888aa]'
          }`}
          title="Paste after current (Insert)"
        >
          <ClipboardPaste size={16} />
        </button>
        <button
          type="button"
          onClick={handlePasteFramesAtEnd}
          disabled={!frameClipboard}
          className={`rounded p-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
            frameClipboard
              ? 'text-[#00f5ff] hover:text-[#00f5ff]/80'
              : 'text-[#8888aa]'
          }`}
          title="Paste at the end (Ctrl+V)"
        >
          <Clipboard size={16} />
        </button>
      </div>

      <div className="mx-3 h-8 w-px bg-white/10" />

      {/* Loop */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleToggleLoop}
          className={`rounded p-2 transition-colors ${
            timeline.loop
              ? 'text-[#00f5ff]'
              : 'text-[#8888aa] hover:text-[#00f5ff]'
          }`}
          title={timeline.loop ? 'Loop on' : 'Loop off'}
        >
          <Repeat size={16} />
        </button>
        <span className="text-[10px] text-[#8888aa]">Loop</span>
      </div>
    </div>
  )
}
