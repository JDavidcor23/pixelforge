import { useCallback, useRef } from 'react'

import { COLOR_PICKER } from '@/constants'

interface UseSaturationValueSquareParams {
  readonly saturation: number
  readonly value: number
  readonly onChange: (saturation: number, value: number) => void
}

/**
 * Pure pointer/keyboard geometry for the saturation/value square — it only
 * ever reports percentages (0-100 on each axis). Converting those into a hex
 * color (which also needs the current hue) is the caller's job, see
 * `useColorPicker.hook.ts`.
 */
export const useSaturationValueSquare = ({ saturation, value, onChange }: UseSaturationValueSquareParams) => {
  const containerRef = useRef<HTMLDivElement>(null)

  const updateFromClientPoint = useCallback(
    (clientX: number, clientY: number) => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
      onChange(x * 100, (1 - y) * 100)
    },
    [onChange],
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      updateFromClientPoint(e.clientX, e.clientY)
    },
    [updateFromClientPoint],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.buttons !== 1) return
      updateFromClientPoint(e.clientX, e.clientY)
    },
    [updateFromClientPoint],
  )

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault()
          onChange(Math.min(100, saturation + COLOR_PICKER.SV_STEP), value)
          break
        case 'ArrowLeft':
          e.preventDefault()
          onChange(Math.max(0, saturation - COLOR_PICKER.SV_STEP), value)
          break
        case 'ArrowUp':
          e.preventDefault()
          onChange(saturation, Math.min(100, value + COLOR_PICKER.SV_STEP))
          break
        case 'ArrowDown':
          e.preventDefault()
          onChange(saturation, Math.max(0, value - COLOR_PICKER.SV_STEP))
          break
        default:
          break
      }
    },
    [saturation, value, onChange],
  )

  return { containerRef, handlePointerDown, handlePointerMove, handlePointerUp, handleKeyDown }
}
