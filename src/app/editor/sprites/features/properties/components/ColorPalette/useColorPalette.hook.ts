import { 
  usePalette, 
  useRemoveColor, 
  useSetPrimaryColor, 
  useSetSecondaryColor 
} from '@/app/editor/sprites/hooks/useSpriteEditorStore.hook'
import type { RgbaColor } from '@/app/editor/types'

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
