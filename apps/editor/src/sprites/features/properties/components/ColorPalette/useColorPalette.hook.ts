import { 
  usePalette, 
  useRemoveColor, 
  useSetPrimaryColor, 
  useSetSecondaryColor 
} from '@/sprites/hooks/useSpriteEditorStore.hook'
import type { RgbaColor } from '@/types'

export const useColorPalette = () => {
  const palette = usePalette()
  const removeColor = useRemoveColor()
  const setPrimaryColor = useSetPrimaryColor()
  const setSecondaryColor = useSetSecondaryColor()

  const handleColorClick = (color: RgbaColor, isSecondary: boolean) => {
    if (isSecondary) {
      setSecondaryColor(color)
    } else {
      setPrimaryColor(color)
    }
  }

  return {
    palette,
    handleColorClick,
    removeColor,
  }
}
