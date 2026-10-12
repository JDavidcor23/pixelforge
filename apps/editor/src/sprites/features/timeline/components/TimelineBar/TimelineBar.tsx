import { Clipboard, ClipboardPaste, Copy, Pause, Play, Plus, Repeat, SkipBack, SkipForward } from 'lucide-react'

import { SPRITE_EDITOR_TIMELINE } from '@/constants'
import { FrameThumbnail } from '../FrameThumbnail/FrameThumbnail'
import { useTimelineBar } from './useTimelineBar.hook'
import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'

const ICON_BUTTON = `flex size-8 items-center justify-center rounded text-muted hover:text-accent ${MOTION.PRESS} ${FOCUS_RING.SURFACE} disabled:pointer-events-none disabled:opacity-30`

export const TimelineBar = () => {
  const {
    frameIds,
    frameCount: totalFrames,
    currentFrameIndex,
    selectedFrameIndices,
    fps,
    isPlaying,
    loop,
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

  return (
    <div className="flex h-full cursor-default items-center gap-3 px-4">
      {/* Transport */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handlePreviousFrame}
          disabled={totalFrames <= 1}
          aria-label="Previous frame"
          className={ICON_BUTTON}
          title="Previous frame"
        >
          <SkipBack size={16} aria-hidden />
        </button>
        <button
          type="button"
          onClick={handleTogglePlayback}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          title={isPlaying ? 'Pause' : 'Play'}
          className={`flex size-8 items-center justify-center rounded bg-accent text-on-accent hover:bg-accent-strong ${MOTION.PRESS} ${FOCUS_RING.SURFACE}`}
        >
          {isPlaying ? <Pause size={16} aria-hidden /> : <Play size={16} aria-hidden />}
        </button>
        <button
          type="button"
          onClick={handleNextFrame}
          disabled={totalFrames <= 1}
          aria-label="Next frame"
          className={ICON_BUTTON}
          title="Next frame"
        >
          <SkipForward size={16} aria-hidden />
        </button>
      </div>

      <div className="h-8 w-px shrink-0 bg-line-strong" />

      {/* FPS */}
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          value={fps}
          min={SPRITE_EDITOR_TIMELINE.MIN_FPS}
          max={SPRITE_EDITOR_TIMELINE.MAX_FPS}
          onChange={handleFpsChange}
          title="Frames per second"
          className="h-7 w-11 rounded border border-line bg-sunken text-center font-mono text-xs text-ink outline-none focus:border-accent"
        />
        <span className="text-2xs text-subtle">FPS</span>
      </div>

      <div className="h-8 w-px shrink-0 bg-line-strong" />

      {/* Frame strip — all interaction handled here, not on individual thumbnails */}
      <div
        ref={stripRef}
        className="relative flex h-full flex-1 select-none items-center gap-2 overflow-x-auto"
        onPointerDown={handleStripPointerDown}
        onPointerMove={handleStripPointerMove}
        onPointerUp={handleStripPointerUp}
      >
        {/* Rubber band selection overlay */}
        {dragRect && dragRect.width > 6 && (
          <div
            className="pointer-events-none absolute top-1.5 bottom-1.5 z-10 rounded border-2 border-dashed border-accent bg-accent/5"
            style={{ left: dragRect.left, width: dragRect.width }}
          >
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
              <span key={pos} className={`absolute size-2 rounded-full bg-accent ${pos}`} />
            ))}
          </div>
        )}

        {/* Frame thumbnails — purely visual */}
        {frameIds.map((frameId, index) => (
          <FrameThumbnail
            key={frameId}
            frameIndex={index}
            isActive={index === currentFrameIndex}
            isSelected={selectedFrameIndices.includes(index)}
            isOnly={totalFrames === 1}
            onRemove={handleRemoveFrame}
          />
        ))}

        <button
          type="button"
          onClick={handleAddFrame}
          onPointerDown={(e) => e.stopPropagation()} // prevent strip drag
          aria-label="Add frame"
          title="Add frame"
          className={`flex h-14 w-8 shrink-0 items-center justify-center rounded-sm border border-line-strong text-muted hover:text-accent ${MOTION.PRESS} ${FOCUS_RING.SURFACE}`}
        >
          <Plus size={16} aria-hidden />
        </button>
      </div>

      <div className="h-8 w-px shrink-0 bg-line-strong" />

      {/* Frame clipboard */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleCopyFrames}
          aria-label="Copy selected frames"
          className={ICON_BUTTON}
          title="Copy selected frames (Ctrl+C)"
        >
          <Copy size={16} aria-hidden />
        </button>
        <button
          type="button"
          onClick={handlePasteFrames}
          disabled={!frameClipboard}
          aria-label="Paste after current"
          className={ICON_BUTTON}
          title="Paste after current (Insert)"
        >
          <ClipboardPaste size={16} aria-hidden />
        </button>
        <button
          type="button"
          onClick={handlePasteFramesAtEnd}
          disabled={!frameClipboard}
          aria-label="Paste at the end"
          className={ICON_BUTTON}
          title="Paste at the end (Ctrl+V)"
        >
          <Clipboard size={16} aria-hidden />
        </button>
      </div>

      <div className="h-8 w-px shrink-0 bg-line-strong" />

      {/* Loop */}
      <button
        type="button"
        onClick={handleToggleLoop}
        aria-pressed={loop}
        title={loop ? 'Loop on' : 'Loop off'}
        className={`flex items-center gap-1.5 rounded px-2 py-1.5 ${MOTION.PRESS} ${FOCUS_RING.SURFACE} ${
          loop ? 'bg-hover text-ink' : 'text-muted hover:text-ink'
        }`}
      >
        <Repeat size={16} className={loop ? 'text-accent' : ''} aria-hidden />
        <span className="text-2xs">Loop</span>
      </button>
    </div>
  )
}
