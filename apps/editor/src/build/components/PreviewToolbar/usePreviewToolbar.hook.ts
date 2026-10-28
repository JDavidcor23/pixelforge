import { useState } from 'react'

import { gameBus } from '@/build/game/event-bus'
import { BUILD_SCREEN_COPY } from '@/constants/build-screen'
import type { GameCommand } from '@/build/types'

/** Pure mapping of the Play/Pause toggle: what to send and how to label it. */
export function getPlaybackToggle(isPaused: boolean) {
  return isPaused
    ? { command: 'resume' as const satisfies GameCommand, label: BUILD_SCREEN_COPY.PREVIEW_RESUME }
    : { command: 'pause' as const satisfies GameCommand, label: BUILD_SCREEN_COPY.PREVIEW_PAUSE }
}

/**
 * `isPaused` lives only here, so toggling re-renders the toolbar and nothing else.
 * Commands are emitted synchronously inside the click handler: fullscreen needs the user gesture.
 */
export function usePreviewToolbar() {
  const [isPaused, setIsPaused] = useState(false)
  const playback = getPlaybackToggle(isPaused)

  const handleRestart = () => {
    // The command binding resumes before restarting, so the toolbar goes back to "running".
    gameBus.commands.emit('restart')
    setIsPaused(false)
  }

  const handleTogglePlayback = () => {
    gameBus.commands.emit(playback.command)
    setIsPaused(!isPaused)
  }

  const handleFullscreen = () => {
    gameBus.commands.emit('fullscreen')
  }

  return {
    isPaused,
    playbackLabel: playback.label,
    handleRestart,
    handleTogglePlayback,
    handleFullscreen,
  }
}
