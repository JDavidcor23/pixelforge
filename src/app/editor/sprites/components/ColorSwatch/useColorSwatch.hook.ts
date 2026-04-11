import type { RgbaColor } from '@/app/editor/types'
import { rgbaToHex } from '@/app/editor/lib'

interface UseColorSwatchParams {
  readonly primaryColor: RgbaColor
  readonly secondaryColor: RgbaColor
}

interface UseColorSwatchReturn {
  readonly primaryBackground: string
  readonly secondaryBackground: string
}

export const useColorSwatch = ({
  primaryColor,
  secondaryColor,
}: UseColorSwatchParams): UseColorSwatchReturn => {
  const primaryBackground =
    primaryColor.a === 0 ? 'transparent' : rgbaToHex(primaryColor)
  const secondaryBackground =
    secondaryColor.a === 0 ? 'transparent' : rgbaToHex(secondaryColor)

  return { primaryBackground, secondaryBackground }
}

