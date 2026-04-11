'use client'

import { useCallback, useRef } from 'react'
import { colord } from 'colord'

interface UseColorAreaParams {
  readonly onChange: (hex: string) => void
}

export const useColorArea = ({ onChange }: UseColorAreaParams) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  // We'll use HSL for easier mapping of coordinates
  // X = Hue (0-360)
  // Y = Saturation/Lightness combined or just one?
  // User image looks like:
  // X axis: Hue
  // Y axis: Lightness/Saturation
  
  const handleInteract = useCallback((e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY

    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))

    // Map X to Hue (0-360)
    const hue = x * 360
    // Map Y to Saturation and Lightness
    // Simple mapping for demonstration: 
    // Saturation constant at 100%
    // Lightness from 100% (top) to 0% (bottom)
    const saturation = 100
    const lightness = (1 - y) * 100

    const newColor = colord({ h: hue, s: saturation, l: lightness }).toHex()
    onChange(newColor)
  }, [onChange])

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true
    handleInteract(e)
    
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) handleInteract(e)
    }
    
    const handleMouseUp = () => {
      isDragging.current = false
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  return {
    containerRef,
    handleMouseDown,
  }
}
