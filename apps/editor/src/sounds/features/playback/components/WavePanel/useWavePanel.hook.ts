import { useCallback, useEffect, useRef } from 'react'

import { useSoundsStore } from '@/stores/sounds.store'
import { audioBufferCache } from '@/lib/audio-buffer-cache'
import { audioEngine } from '@/lib/audio-engine'
import { formatDuration } from '@/lib/sound-assets'
import type { AudioAsset } from '@/types/audio'

/**
 * Playback for the selected asset: one AudioBufferSourceNode at a time,
 * routed through a gain node into the engine's analyser. Position is
 * mirrored into the store every animation frame while playing.
 */
export function useWavePanel(asset: AudioAsset) {
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const bufferRef = useRef<AudioBuffer | null>(null)
  const rafRef = useRef<number | null>(null)
  const startedAtRef = useRef(0)
  const offsetRef = useRef(0)

  const playbackState = useSoundsStore((state) => state.playbackState)
  const currentTime = useSoundsStore((state) => state.currentTime)
  const volume = useSoundsStore((state) => state.volume)
  const loop = useSoundsStore((state) => state.loop)
  const setPlaybackState = useSoundsStore((state) => state.setPlaybackState)
  const setCurrentTime = useSoundsStore((state) => state.setCurrentTime)
  const setDuration = useSoundsStore((state) => state.setDuration)
  const setVolume = useSoundsStore((state) => state.setVolume)
  const setLoop = useSoundsStore((state) => state.setLoop)
  const setActiveAsset = useSoundsStore((state) => state.setActiveAsset)

  const duration = asset.duration
  const isPlaying = playbackState === 'playing'

  const stopSource = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    const source = sourceRef.current
    if (source) {
      source.onended = null
      try {
        source.stop()
      } catch {
        // Already stopped.
      }
      source.disconnect()
      sourceRef.current = null
    }
    gainRef.current?.disconnect()
    gainRef.current = null
  }, [])

  const startSource = useCallback(
    (buffer: AudioBuffer, offset: number) => {
      stopSource()
      const ctx = audioEngine.getContext()
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(volume, ctx.currentTime)
      gain.connect(audioEngine.getAnalyserNode())

      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.loop = loop
      source.connect(gain)
      source.onended = () => {
        if (sourceRef.current !== source) return
        stopSource()
        setPlaybackState('idle')
        setCurrentTime(0)
      }

      sourceRef.current = source
      gainRef.current = gain
      bufferRef.current = buffer
      startedAtRef.current = ctx.currentTime
      offsetRef.current = offset
      source.start(0, offset)
      setPlaybackState('playing')

      const tick = () => {
        const elapsed = ctx.currentTime - startedAtRef.current + offsetRef.current
        const position = source.loop ? elapsed % buffer.duration : Math.min(elapsed, buffer.duration)
        setCurrentTime(position)
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    },
    [stopSource, volume, loop, setPlaybackState, setCurrentTime]
  )

  const handleTogglePlay = useCallback(async () => {
    if (isPlaying) {
      stopSource()
      setPlaybackState('paused')
      return
    }
    await audioEngine.resume()
    const buffer = await audioBufferCache.load(asset)
    if (!buffer) return
    const offset = currentTime >= buffer.duration ? 0 : currentTime
    startSource(buffer, offset)
  }, [isPlaying, stopSource, setPlaybackState, asset, currentTime, startSource])

  const handleStop = useCallback(() => {
    stopSource()
    setPlaybackState('idle')
    setCurrentTime(0)
  }, [stopSource, setPlaybackState, setCurrentTime])

  const handleSeek = useCallback(
    (time: number) => {
      const clamped = Math.min(duration, Math.max(0, time))
      setCurrentTime(clamped)
      if (isPlaying && bufferRef.current) startSource(bufferRef.current, clamped)
    },
    [duration, isPlaying, setCurrentTime, startSource]
  )

  const handleVolumeChange = useCallback(
    (next: number) => {
      setVolume(next)
      const gain = gainRef.current
      if (gain) gain.gain.setValueAtTime(next, audioEngine.getContext().currentTime)
    },
    [setVolume]
  )

  const handleLoopToggle = useCallback(() => {
    const next = !loop
    setLoop(next)
    if (sourceRef.current) sourceRef.current.loop = next
  }, [loop, setLoop])

  // A different asset: stop whatever was playing and rewind.
  useEffect(() => {
    stopSource()
    bufferRef.current = null
    setPlaybackState('idle')
    setCurrentTime(0)
    setActiveAsset(asset.id)
  }, [asset.id, stopSource, setPlaybackState, setCurrentTime, setActiveAsset])

  useEffect(() => {
    setDuration(duration)
  }, [duration, setDuration])

  useEffect(() => stopSource, [stopSource])

  return {
    peaks: asset.peaks,
    progress: duration > 0 ? currentTime / duration : 0,
    currentTime,
    duration,
    isPlaying,
    loop,
    volume,
    timeLabel: `${formatDuration(currentTime)} / ${formatDuration(duration)}`,
    handleTogglePlay,
    handleStop,
    handleSeek,
    handleVolumeChange,
    handleLoopToggle,
  }
}
