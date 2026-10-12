import { CURSOR_POSITION_FALLBACK } from '@/constants'
import { useCursorPixel } from '@/sprites/hooks/useSpriteEditorStore.hook'

interface UsePositionFieldsReturn {
  readonly x: number | string
  readonly y: number | string
}

/**
 * Isolates the `cursorPixel` subscription (changes on every mouse move over
 * the canvas) so only this hook's component re-renders while the pointer
 * moves, instead of the whole PropertiesTab.
 */
export const usePositionFields = (): UsePositionFieldsReturn => {
  const cursorPixel = useCursorPixel()

  return {
    x: cursorPixel?.x ?? CURSOR_POSITION_FALLBACK,
    y: cursorPixel?.y ?? CURSOR_POSITION_FALLBACK,
  }
}
