'use client'

import { Play, Square, Repeat } from 'lucide-react'
import { useTransportBar } from './useTransportBar.hook'

export function TransportBar() {
  const {
    playbackState,
    currentTime,
    duration,
    volume,
    loop,
    formattedCurrentTime,
    formattedDuration,
    hasBuffer,
    handlePlay,
    handleStop,
    handleSeek,
    handleVolumeChange,
    handleLoopToggle,
  } = useTransportBar()

  const isPlaying = playbackState === 'playing'

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-gray-800 p-4">
      {/* Seek Scrubber */}
      <div className="flex items-center gap-3">
        <span className="min-w-[3.5rem] text-right font-mono text-xs text-gray-400">
          {formattedCurrentTime}
        </span>
        <input
          type="range"
          min={0}
          max={duration || 1}
          step={0.01}
          value={currentTime}
          onChange={(e) => handleSeek(Number(e.target.value))}
          aria-label={`Seek position: ${formattedCurrentTime} of ${formattedDuration}`}
          className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-gray-700 accent-violet-500"
        />
        <span className="min-w-[3.5rem] font-mono text-xs text-gray-400">
          {formattedDuration}
        </span>
      </div>

      {/* Controls Row */}
      <div className="flex items-center justify-between">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePlay}
            disabled={!hasBuffer || isPlaying}
            aria-label="Play audio"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600 text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleStop}
            disabled={!isPlaying}
            aria-label="Stop audio"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-700 text-gray-100 transition-colors hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Square className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleLoopToggle}
            aria-label={loop ? 'Disable loop playback' : 'Enable loop playback'}
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
              loop
                ? 'bg-violet-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-gray-100'
            }`}
          >
            <Repeat className="h-4 w-4" />
          </button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <label htmlFor="volume-slider" className="text-xs font-medium text-gray-400">
            Vol
          </label>
          <input
            id="volume-slider"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => handleVolumeChange(Number(e.target.value))}
            aria-label={`Volume: ${Math.round(volume * 100)}%`}
            className="h-2 w-24 cursor-pointer appearance-none rounded-full bg-gray-700 accent-violet-500"
          />
          <span className="min-w-[2.5rem] text-right font-mono text-xs text-violet-400">
            {Math.round(volume * 100)}%
          </span>
        </div>
      </div>
    </div>
  )
}
