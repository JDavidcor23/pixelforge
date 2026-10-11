import { useCallback, useEffect, useRef, useState } from 'react'

import { useSoundsStore } from '@/stores/sounds.store'
import { audioEngine } from '@/lib/audio-engine'
import { loadClipBuffers } from '@/lib/timeline-buffers'
import { timelineDuration } from '@/lib/timeline-ops'
import { timelinePlayer } from '@/lib/timeline-player'
import { TIME_EPSILON } from '@/constants/timeline'
import type { MixInput } from '@/types/timeline-view'

/** Builds the player input from the live store (read at call time, never stale). */
function currentMixInput(buffers: ReadonlyMap<string, AudioBuffer>): MixInput {
  const { clips, tracks, volume } = useSoundsStore.getState()
  return { clips, tracks, buffers, masterVolume: volume }
}

/**
 * Timeline playback. The player owns the audio graph; this hook drives the
 * playhead from AudioContext time every animation frame and loops over
 * [0, timelineDuration].
 *
 * It never subscribes to `playheadTime` or `clips` for rendering — seeks and
 * edits are observed through a store subscription, so the editor does not
 * re-render on every frame. Clip edits made during a gesture (drag, slider)
 * are rescheduled ONCE, when the gesture ends.
 */
export function useTimelinePlayback() {
  const [isPlaying, setIsPlaying] = useState(false)
  const isPlayingRef = useRef(false)
  const frameRef = useRef<number | null>(null)
  const buffersRef = useRef<Map<string, AudioBuffer>>(new Map())
  // Last playhead the player itself wrote; anything else is a user seek.
  const lastWrittenRef = useRef(0)
  // Bumped on every start/stop so a slow buffer load cannot resurrect playback.
  const runIdRef = useRef(0)
  // Clips changed mid-gesture: reschedule when the gesture closes.
  const pendingRescheduleRef = useRef(false)

  const volume = useSoundsStore((state) => state.volume)
  const loop = useSoundsStore((state) => state.loop)
  const setPlayhead = useSoundsStore((state) => state.setPlayhead)
  const setVolume = useSoundsStore((state) => state.setVolume)
  const setLoop = useSoundsStore((state) => state.setLoop)

  const writePlayhead = useCallback(
    (time: number) => {
      lastWrittenRef.current = time
      setPlayhead(time)
    },
    [setPlayhead]
  )

  const cancelFrame = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
  }, [])

  const halt = useCallback(() => {
    runIdRef.current += 1
    pendingRescheduleRef.current = false
    cancelFrame()
    timelinePlayer.stop()
    isPlayingRef.current = false
    setIsPlaying(false)
  }, [cancelFrame])

  const runFrames = useCallback(() => {
    const step = () => {
      const state = useSoundsStore.getState()
      const end = timelineDuration(state.clips)
      let position = timelinePlayer.position()
      if (position >= end) {
        if (!state.loop) {
          halt()
          writePlayhead(end)
          return
        }
        timelinePlayer.play(currentMixInput(buffersRef.current), 0)
        position = 0
      }
      writePlayhead(position)
      frameRef.current = requestAnimationFrame(step)
    }
    frameRef.current = requestAnimationFrame(step)
  }, [halt, writePlayhead])

  const start = useCallback(
    async (from: number) => {
      const runId = ++runIdRef.current
      pendingRescheduleRef.current = false
      cancelFrame()
      timelinePlayer.stop()
      lastWrittenRef.current = from

      try {
        await audioEngine.resume()
        const { clips, assets } = useSoundsStore.getState()
        const { buffers } = await loadClipBuffers(clips, assets)
        if (runId !== runIdRef.current) return

        buffersRef.current = buffers
        timelinePlayer.play(currentMixInput(buffers), from)
        isPlayingRef.current = true
        setIsPlaying(true)
        runFrames()
      } catch (error) {
        console.error('Failed to start timeline playback:', error)
        if (runId === runIdRef.current) halt()
      }
    },
    [cancelFrame, runFrames, halt]
  )

  const handleTogglePlay = useCallback(() => {
    if (isPlayingRef.current) {
      halt()
      return
    }
    const { playheadTime: from, clips } = useSoundsStore.getState()
    void start(from >= timelineDuration(clips) - TIME_EPSILON ? 0 : from)
  }, [halt, start])

  const handleStop = useCallback(() => {
    halt()
    writePlayhead(0)
  }, [halt, writePlayhead])

  const handleLoopToggle = useCallback(() => setLoop(!loop), [loop, setLoop])

  // Seeks, clip edits and mix changes while playing — observed without re-rendering.
  useEffect(
    () =>
      useSoundsStore.subscribe((state, prev) => {
        if (state.tracks !== prev.tracks || state.volume !== prev.volume) {
          timelinePlayer.setMix(state.tracks, state.volume)
        }
        if (!isPlayingRef.current) return

        const isSeek =
          state.playheadTime !== prev.playheadTime &&
          Math.abs(state.playheadTime - lastWrittenRef.current) > TIME_EPSILON
        if (isSeek) {
          void start(state.playheadTime)
          return
        }

        if (state.clips !== prev.clips) pendingRescheduleRef.current = true
        const inGesture = state.timelineGestureSnapshot !== null
        if (pendingRescheduleRef.current && !inGesture) void start(timelinePlayer.position())
      }),
    [start]
  )

  useEffect(() => halt, [halt])

  return {
    isPlaying,
    loop,
    volume,
    handleTogglePlay,
    handleStop,
    handleLoopToggle,
    handleVolumeChange: setVolume,
  }
}
