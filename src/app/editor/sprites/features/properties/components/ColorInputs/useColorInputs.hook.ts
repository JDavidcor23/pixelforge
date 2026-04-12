import { useState, useEffect } from 'react'
import { colord } from 'colord'
import { useSaveColor } from '@/app/editor/sprites/hooks/useSpriteEditorStore.hook'

interface UseColorInputsParams {
  readonly color: string
  readonly onChange: (hex: string) => void
}

export const useColorInputs = ({ color, onChange }: UseColorInputsParams) => {
  const [hexInput, setHexInput] = useState(color.toUpperCase())
  const [isFocused, setIsFocused] = useState(false)

  // Sync internal state with external prop ONLY when not focused
  // This prevents high-frequency re-renders (like cursor movement) from resetting intermediate typing
  useEffect(() => {
    if (!isFocused) {
      setHexInput(color.toUpperCase())
    }
  }, [color, isFocused])

  const handleHexChange = (value: string) => {
    setHexInput(value) // Allow raw input (lowercase, etc.)
    
    const c = colord(value)
    if (c.isValid()) {
      onChange(c.toHex())
    }
  }

  const handleHexBlur = () => {
    setIsFocused(false)
    // On blur, normalize to whatever the current valid color is
    setHexInput(color.toUpperCase())
  }

  const handleHexFocus = () => {
    setIsFocused(true)
  }

  const handleRgbaChange = (channel: 'r' | 'g' | 'b' | 'a', value: string) => {
    const numValue = Math.min(255, Math.max(0, parseInt(value, 10) || 0))
    const currentRgba = colord(hexInput).toRgb()
    const newColor = colord({ 
      ...currentRgba, 
      [channel]: channel === 'a' ? numValue / 255 : numValue 
    }).toHex()
    
    onChange(newColor)
    // For RGBA we sync immediately
    if (!isFocused) {
       setHexInput(newColor.toUpperCase())
    }
  }

  const currentRgba = colord(hexInput).toRgb()
  const displayRgba = {
    ...currentRgba,
    a: Math.round(currentRgba.a * 255)
  }

  const saveColor = useSaveColor()

  const handleSave = () => {
    const c = colord(hexInput)
    if (c.isValid()) {
      const rgba = c.toRgb()
      saveColor({
        r: rgba.r,
        g: rgba.g,
        b: rgba.b,
        a: Math.round(rgba.a * 255),
      })
    }
  }

  return {
    hexInput,
    currentRgba: displayRgba,
    handleHexChange,
    handleHexBlur,
    handleHexFocus,
    handleRgbaChange,
    handleSave,
  }
}
