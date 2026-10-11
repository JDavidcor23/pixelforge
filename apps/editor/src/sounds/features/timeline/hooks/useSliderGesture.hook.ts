import { useCallback } from 'react'

import { useSoundsStore } from '@/stores/sounds.store'

/**
 * A pointer drag on a timeline slider is ONE undo step: the gesture opens on
 * press and closes on release anywhere in the window. Keyboard steps commit
 * individually (one step per key press), which is what users expect.
 */
export function useSliderGesture() {
  const beginGesture = useSoundsStore((state) => state.beginGesture)
  const endGesture = useSoundsStore((state) => state.endGesture)

  const handleSliderPointerDown = useCallback(() => {
    beginGesture()
    const finish = () => {
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', finish)
      endGesture()
    }
    window.addEventListener('pointerup', finish)
    window.addEventListener('pointercancel', finish)
  }, [beginGesture, endGesture])

  return { handleSliderPointerDown }
}
