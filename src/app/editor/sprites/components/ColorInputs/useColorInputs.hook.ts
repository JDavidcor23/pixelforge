import { useState, useEffect } from 'react'
import { colord } from 'colord'

interface UseColorInputsParams {
  readonly color: string
  readonly onChange: (hex: string) => void
}

export const useColorInputs = ({ color, onChange }: UseColorInputsParams) => {
  const [hexInput, setHexInput] = useState(color.toUpperCase())
  const [isFocused, setIsFocused] = useState(false)

  // Sync internal state with external prop ONLY when not focused
  useEffect(() => {
    if (!isFocused) {
      setHexInput(color.toUpperCase())
    }
  }, [color, isFocused])

  const handleHexChange = (value: string) => {
    setHexInput(value)
    
    const c = colord(value)
    if (c.isValid()) {
      onChange(c.toHex())
    }
  }

  const handleHexBlur = () => {
    setIsFocused(false)
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
    if (!isFocused) {
       setHexInput(newColor.toUpperCase())
    }
  }

  const currentRgba = colord(hexInput).toRgb()
  const displayRgba = {
    ...currentRgba,
    a: Math.round(currentRgba.a * 255)
  }

  return {
    hexInput,
    currentRgba: displayRgba,
    handleHexChange,
    handleHexBlur,
    handleHexFocus,
    handleRgbaChange,
  }
}
