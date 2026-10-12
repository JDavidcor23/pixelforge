import { X } from 'lucide-react'
import { useColorPalette } from './useColorPalette.hook'
import { rgbaToHex } from '@/lib'
import type { RgbaColor } from '@/types'

export const ColorPalette = () => {
  const { palette, handleColorClick, removeColor } = useColorPalette()

  if (palette.length === 0) {
    return (
      <div className="flex h-12 items-center justify-center rounded-sm border border-dashed border-line-strong text-2xs text-subtle">
        Click Save to keep a color here.
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
              className="h-6 w-6 rounded-sm border border-line transition-transform hover:scale-110 active:scale-95"
              style={{ backgroundColor: hex }}
              title={`${hex} — click to use as primary, Shift+click for secondary`}
            />
            <button
              type="button"
              onClick={() => removeColor(color)}
              aria-label={`Remove ${hex} from palette`}
              className="absolute -right-1 -top-1 hidden h-3 w-3 items-center justify-center rounded-full bg-danger text-on-accent group-hover:flex"
            >
              <X size={8} aria-hidden />
            </button>
          </div>
        )
      })}
    </div>
  )
}
