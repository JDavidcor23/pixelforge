import { useState, useEffect } from 'react'
import { colord } from 'colord'

interface UseColorInputsParams {
  readonly color: string
  readonly onChange: (hex: string) => void
}

export const useColorInputs = ({ color, onChange }: UseColorInputsParams) => {
  const [hexInput, setHexInput] = useState(color.toUpperCase())

  // Sync internal state with external prop
  useEffect(() => {
    setHexInput(color.toUpperCase())
  }, [color])

  const handleHexChange = (value: string) => {
    setHexInput(value.toUpperCase())
    const c = colord(value)
    if (c.isValid()) {
      // toHex() returns 8-digit hex if alpha < 1
      onChange(c.toHex())
    }
  }

  const handleRgbaChange = (channel: 'r' | 'g' | 'b' | 'a', value: string) => {
    const numValue = Math.min(255, Math.max(0, parseInt(value, 10) || 0))
    
    const currentRgba = colord(hexInput).toRgb()
    const newColor = colord({ ...currentRgba, [channel]: channel === 'a' ? numValue / 255 : numValue }).toHex()
    
    setHexInput(newColor.toUpperCase())
    onChange(newColor)
  }

  const currentRgba = colord(hexInput).toRgb()
  // Convert alpha from 0-1 to 0-255 for the input
  const displayRgba = {
    ...currentRgba,
    a: Math.round(currentRgba.a * 255)
  }

  return {
    hexInput,
    currentRgba: displayRgba,
    handleHexChange,
    handleRgbaChange,
  }
}
