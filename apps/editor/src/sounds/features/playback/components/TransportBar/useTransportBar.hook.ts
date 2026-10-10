import { useRef, useCallback, useEffect } from 'react'

import { audioEngine } from '@/lib/audio-engine'
import { useSoundsStore } from '@/stores/sounds.store'
import type { AudioAsset } from '@/types/audio'

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export function useTransportBar() {
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const rafIdRef = useRef<number | null>(null)
  const startTimeRef = useRef(0)
  const offsetRef = useRef(0)

  const playbackState = useSoundsStore((state) => state.playbackState)
  const currentTime = useSoundsStore((state) => state.currentTime)
  const duration = useSoundsStore((state) => state.duration)
  const volume = useSoundsStore((state) => state.volume)
  const loop = useSoundsStore((state) => state.loop)
  const activeAssetId = useSoundsStore((state) => state.activeAssetId)
  const generatedBuffer = useSoundsStore((state) => state.generatedBuffer)
  const assets = useSoundsStore((state) => state.assets)

  const setPlaybackState = useSoundsStore((state) => state.setPlaybackState)
  const setCurrentTime = useSoundsStore((state) => state.setCurrentTime)
  const setDuration = useSoundsStore((state) => state.setDuration)
  const setVolume = useSoundsStore((state) => state.setVolume)
  const setLoop = useSoundsStore((state) => state.setLoop)
  const resetPlayback = useSoundsStore((state) => state.resetPlayback)

  const stopTimeUpdate = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
  }, [])

  const startTimeUpdate = useCallback(() => {
    stopTimeUpdate()

    function update() {
      const ctx = audioEngine.getContext()
      const elapsed = ctx.currentTime - startTimeRef.current + offsetRef.current
      setCurrentTime(Math.min(elapsed, duration))
      rafIdRef.current = requestAnimationFrame(update)
    }

    rafIdRef.current = requestAnimationFrame(update)
  }, [stopTimeUpdate, setCurrentTime, duration])

  const getAudioBuffer = useCallback((): AudioBuffer | null => {
    if (activeAssetId) {
      const asset: AudioAsset | undefined = assets.find((a) => a.id === activeAssetId)
      if (asset && asset.localObjectUrl) {
        // Buffer should already be decoded and stored; for now rely on generatedBuffer
        // In a full implementation, decoded buffers would be cached per asset
        return generatedBuffer
      }
    }
    return generatedBuffer
  }, [activeAssetId, assets, generatedBuffer])

  const startPlayback = useCallback(
    (offset: number = 0) => {
      const buffer = getAudioBuffer()
      if (!buffer) return

      const ctx = audioEngine.getContext()
      const analyser = audioEngine.getAnalyserNode()

      // Create gain node
      const gainNode = ctx.createGain()
      gainNode.gain.setValueAtTime(volume, ctx.currentTime)
      gainNodeRef.current = gainNode

      // Create buffer source
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.loop = loop

      // Connect: source → gain → analyser (analyser already connected to destination)
      source.connect(gainNode)
      gainNode.connect(analyser)

      source.onended = () => {
        stopTimeUpdate()
        if (sourceRef.current === source) {
          sourceRef.current = null
          if (loop) {
            offsetRef.current = 0
            startPlayback(0)
          } else {
            setPlaybackState('idle')
            setCurrentTime(0)
          }
        }
      }

      sourceRef.current = source
      offsetRef.current = offset
      startTimeRef.current = ctx.currentTime

      source.start(0, offset)
      setDuration(buffer.duration)
      setPlaybackState('playing')
      startTimeUpdate()
    },
    [
      getAudioBuffer,
      volume,
      loop,
      setPlaybackState,
      setCurrentTime,
      setDuration,
      startTimeUpdate,
      stopTimeUpdate,
    ]
  )

  const handlePlay = useCallback(async () => {
    if (playbackState === 'playing') return

    if (audioEngine.isSuspended()) {
      await audioEngine.resume()
    }

    startPlayback(currentTime)
  }, [playbackState, currentTime, startPlayback])

  const handleStop = useCallback(() => {
    stopTimeUpdate()

    if (sourceRef.current) {
      try {
        sourceRef.current.stop()
        sourceRef.current.disconnect()
      } catch {
        // Source may already have stopped
      }
      sourceRef.current = null
    }

    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect()
      gainNodeRef.current = null
    }

    resetPlayback()
  }, [stopTimeUpdate, resetPlayback])

  const handleSeek = useCallback(
    (time: number) => {
      setCurrentTime(time)

      if (playbackState === 'playing') {
        // Stop current and restart at new position
        if (sourceRef.current) {
          try {
            sourceRef.current.stop()
            sourceRef.current.disconnect()
          } catch {
            // Source may already have stopped
          }
          sourceRef.current = null
        }

        if (gainNodeRef.current) {
          gainNodeRef.current.disconnect()
          gainNodeRef.current = null
        }

        stopTimeUpdate()
        startPlayback(time)
      }
    },
    [playbackState, setCurrentTime, stopTimeUpdate, startPlayback]
  )

  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      setVolume(newVolume)

      if (gainNodeRef.current) {
        const ctx = audioEngine.getContext()
        gainNodeRef.current.gain.setValueAtTime(newVolume, ctx.currentTime)
      }
    },
    [setVolume]
  )

  const handleLoopToggle = useCallback(() => {
    const newLoop = !loop
    setLoop(newLoop)

    if (sourceRef.current) {
      sourceRef.current.loop = newLoop
    }
  }, [loop, setLoop])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimeUpdate()
      if (sourceRef.current) {
        try {
          sourceRef.current.stop()
          sourceRef.current.disconnect()
        } catch {
          // Source may already have stopped
        }
      }
      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect()
      }
    }
  }, [stopTimeUpdate])

  return {
    playbackState,
    currentTime,
    duration,
    volume,
    loop,
    formattedCurrentTime: formatTime(currentTime),
    formattedDuration: formatTime(duration),
    hasBuffer: getAudioBuffer() !== null,
    handlePlay,
    handleStop,
    handleSeek,
    handleVolumeChange,
    handleLoopToggle,
  }
}
