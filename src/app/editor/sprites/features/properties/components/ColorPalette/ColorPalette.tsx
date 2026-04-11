'use client'

import React from 'react'
import { X } from 'lucide-react'
import { useColorPalette } from './useColorPalette.hook'
import { rgbaToHex } from '@/app/editor/lib'
import type { RgbaColor } from '@/app/editor/types'

export const ColorPalette = () => {
  const { palette, handleColorClick, removeColor } = useColorPalette()

  if (palette.length === 0) {
    return (
      <div className="flex h-12 items-center justify-center rounded border border-dashed border-white/10 text-[10px] text-[#8888aa]">
        No saved colors
      </div>
    )
  }

  return (
    <div className="grid grid-cols-8 gap-1">
      {palette.map((color: RgbaColor, index) => {
        const hex = rgbaToHex(color)
        return (
          <div key={`${hex}-${index}`} className="group relative">
            <button
              type="button"
              onClick={(e) => handleColorClick(color, e.shiftKey)}
              className="h-6 w-6 rounded border border-white/10 transition-transform hover:scale-110 active:scale-95"
              style={{ backgroundColor: hex }}
              title={`${hex} (Shift+Click for secondary)`}
            />
            <button
              type="button"
              onClick={() => removeColor(color)}
              className="absolute -right-1 -top-1 hidden h-3 w-3 items-center justify-center rounded-full bg-red-500 text-white group-hover:flex"
            >
              <X size={8} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
