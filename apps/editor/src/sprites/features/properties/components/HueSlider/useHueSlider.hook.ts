import { useCallback, useRef } from 'react'

import { COLOR_PICKER } from '@/constants'

interface UseHueSliderParams {
  readonly hue: number
  readonly onChange: (hue: number) => void
}

export const useHueSlider = ({ hue, onChange }: UseHueSliderParams) => {
  const trackRef = useRef<HTMLDivElement>(null)

  const updateFromClientX = useCallback(
    (clientX: number) => {
      const el = trackRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      onChange(x * 360)
    },
    [onChange],
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      updateFromClientX(e.clientX)
    },
    [updateFromClientX],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.buttons !== 1) return
      updateFromClientX(e.clientX)
    },
    [updateFromClientX],
  )

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault()
        onChange(Math.min(360, hue + COLOR_PICKER.HUE_STEP))
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault()
        onChange(Math.max(0, hue - COLOR_PICKER.HUE_STEP))
      }
    },
    [hue, onChange],
  )

  return { trackRef, handlePointerDown, handlePointerMove, handlePointerUp, handleKeyDown }
}
