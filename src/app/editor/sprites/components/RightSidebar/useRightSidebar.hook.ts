'use client'

import { useState, useCallback, useMemo } from 'react'
import { colord } from 'colord'

import {
  useCursorPixel,
  useActiveLayerId,
  useLayers,
  useSetLayerOpacity,
  usePrimaryColor,
  useSecondaryColor,
  useSetPrimaryColor,
  useSetSecondaryColor,
} from '../../hooks/useSpriteEditorStore.hook'
import type { RgbaColor } from '@/app/editor/types'

export const useRightSidebar = () => {
  const cursorPixel = useCursorPixel()
  const activeLayerId = useActiveLayerId()
  const layers = useLayers()
  const setLayerOpacity = useSetLayerOpacity()

  const primaryColor = usePrimaryColor()
  const secondaryColor = useSecondaryColor()
  const setPrimaryColor = useSetPrimaryColor()
  const setSecondaryColor = useSetSecondaryColor()

  const [activeColorType, setActiveColorType] = useState<'primary' | 'secondary'>(
    'primary'
  )

  const activeLayer = layers.find((l) => l.id === activeLayerId)
  const activeLayerOpacity = activeLayer?.opacity ?? 100

  // Helpers to convert RgbaColor to Hex for ColorInputs
  const rgbaToHex = (color: RgbaColor) => {
    return colord({
      r: color.r,
      g: color.g,
      b: color.b,
      a: color.a / 255,
    }).toHex()
  }

  // Helpers to convert Hex to RgbaColor for the Store
  const hexToRgba = (hex: string): RgbaColor => {
    const rgba = colord(hex).toRgb()
    return {
      r: rgba.r,
      g: rgba.g,
      b: rgba.b,
      a: Math.round(rgba.a * 255),
    }
  }

  const primaryHex = useMemo(() => rgbaToHex(primaryColor), [primaryColor])
  const secondaryHex = useMemo(() => rgbaToHex(secondaryColor), [secondaryColor])

  const activeColorHex = activeColorType === 'primary' ? primaryHex : secondaryHex

  const handleOpacityChange = useCallback(
    (value: number) => {
      setLayerOpacity(activeLayerId, value)
    },
    [activeLayerId, setLayerOpacity]
  )

  const handleColorChange = useCallback(
    (newHex: string) => {
      const rgba = hexToRgba(newHex)
      if (activeColorType === 'primary') {
        setPrimaryColor(rgba)
      } else {
        setSecondaryColor(rgba)
      }
    },
    [activeColorType, setPrimaryColor, setSecondaryColor]
  )

  const handleToggleActiveColor = useCallback((type: 'primary' | 'secondary') => {
    setActiveColorType(type)
  }, [])

  return {
    cursorPixel,
    activeLayerOpacity,
    primaryHex,
    secondaryHex,
    activeColorHex,
    activeColorType,
    handleOpacityChange,
    handleColorChange,
    handleToggleActiveColor,
  }
}

