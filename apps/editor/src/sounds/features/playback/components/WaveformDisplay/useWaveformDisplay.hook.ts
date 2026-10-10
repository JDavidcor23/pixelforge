import { useRef, useEffect, useCallback } from 'react'

import { audioEngine } from '@/lib/audio-engine'
import { useSoundsStore } from '@/stores/sounds.store'

const CANVAS_HEIGHT = 120
const WAVEFORM_COLOR = '#10b981'
const CURSOR_COLOR = '#ffffff'
const BACKGROUND_COLOR = '#111827'

export function useWaveformDisplay() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const rafIdRef = useRef<number | null>(null)
  const isVisibleRef = useRef(true)

  const playbackState = useSoundsStore((state) => state.playbackState)
  const currentTime = useSoundsStore((state) => state.currentTime)
  const duration = useSoundsStore((state) => state.duration)
  const setCurrentTime = useSoundsStore((state) => state.setCurrentTime)

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    // Clear canvas
    ctx.fillStyle = BACKGROUND_COLOR
    ctx.fillRect(0, 0, width, height)

    // Get analyser data
    const analyser = audioEngine.getAnalyserNode()
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyser.getByteTimeDomainData(dataArray)

    // Draw waveform line
    ctx.lineWidth = 2
    ctx.strokeStyle = WAVEFORM_COLOR
    ctx.beginPath()

    const sliceWidth = width / bufferLength
    let x = 0

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0
      const y = (v * height) / 2

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }

      x += sliceWidth
    }

    ctx.lineTo(width, height / 2)
    ctx.stroke()

    // Draw playback position cursor
    if (duration > 0) {
      const cursorX = (currentTime / duration) * width
      ctx.strokeStyle = CURSOR_COLOR
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(cursorX, 0)
      ctx.lineTo(cursorX, height)
      ctx.stroke()
    }

    // Continue animation loop
    if (isVisibleRef.current && playbackState === 'playing') {
      rafIdRef.current = requestAnimationFrame(drawWaveform)
    }
  }, [playbackState, currentTime, duration])

  // Animation loop management
  useEffect(() => {
    if (playbackState === 'playing' && isVisibleRef.current) {
      rafIdRef.current = requestAnimationFrame(drawWaveform)
    }

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
    }
  }, [playbackState, drawWaveform])

  // Draw idle state when not playing
  useEffect(() => {
    if (playbackState !== 'playing') {
      drawWaveform()
    }
  }, [playbackState, currentTime, drawWaveform])

  // Visibility change handler
  useEffect(() => {
    function handleVisibilityChange() {
      isVisibleRef.current = !document.hidden

      if (document.hidden) {
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current)
          rafIdRef.current = null
        }
      } else if (playbackState === 'playing') {
        rafIdRef.current = requestAnimationFrame(drawWaveform)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [playbackState, drawWaveform])

  // ResizeObserver for responsive canvas width
  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width
        canvas.width = width
        canvas.height = CANVAS_HEIGHT
        drawWaveform()
      }
    })

    observer.observe(container)

    return () => {
      observer.disconnect()
    }
  }, [drawWaveform])

  const handleCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas || duration <= 0) return

      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const seekTime = (x / rect.width) * duration

      setCurrentTime(Math.max(0, Math.min(seekTime, duration)))
    },
    [duration, setCurrentTime]
  )

  return {
    canvasRef,
    containerRef,
    handleCanvasClick,
    canvasHeight: CANVAS_HEIGHT,
  }
}
