'use client'

import type { RgbaColor } from '@/app/editor/types'
import { useColorSwatch } from './useColorSwatch.hook'

interface ColorSwatchProps {
  readonly primaryColor: RgbaColor
  readonly secondaryColor: RgbaColor
}

export const ColorSwatch = ({ primaryColor, secondaryColor }: ColorSwatchProps) => {
  const { primaryBackground, secondaryBackground } = useColorSwatch({
    primaryColor,
    secondaryColor,
  })

  return (
    <div className="relative ml-2 h-8 w-8">
      <div
        className="absolute bottom-0 right-0 h-5 w-5 rounded border border-white/20"
        style={{ backgroundColor: secondaryBackground }}
      />
      <div
        className="absolute left-0 top-0 z-10 h-5 w-5 rounded border border-white/30"
        style={{ backgroundColor: primaryBackground }}
      />
    </div>
  )
}

