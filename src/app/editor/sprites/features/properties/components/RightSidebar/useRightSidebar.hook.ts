'use client'

import { useState, useCallback, useMemo } from 'react'
import { colord } from 'colord'

import {
  useActiveLayerId,
  useActiveLayerOpacity,
  useSetLayerOpacity,
  usePrimaryColor,
  useSecondaryColor,
  useSetPrimaryColor,
  useSetSecondaryColor,
  useOverwriteWithPfm,
} from '@/app/editor/sprites/hooks/useSpriteEditorStore.hook'
import type { RgbaColor } from '@/app/editor/types'

export const useRightSidebar = () => {
  const activeLayerId = useActiveLayerId()
  const activeLayerOpacity = useActiveLayerOpacity()
  const setLayerOpacity = useSetLayerOpacity()

  const handleOpacityChange = useCallback(
    (value: number) => {
      setLayerOpacity(activeLayerId, value)
    },
    [activeLayerId, setLayerOpacity]
  )

  return {
    activeLayerOpacity,
    handleOpacityChange,
  }
}

export const useColorSection = () => {
  const primaryColor = usePrimaryColor()
  const secondaryColor = useSecondaryColor()
  const setPrimaryColor = useSetPrimaryColor()
  const setSecondaryColor = useSetSecondaryColor()

  const [activeColorType, setActiveColorType] = useState<'primary' | 'secondary'>(
    'primary'
  )

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
    primaryHex,
    secondaryHex,
    activeColorHex,
    activeColorType,
    handleColorChange,
    handleToggleActiveColor,
  }
}

export const useAiCopilot = () => {
  const overwriteWithPfm = useOverwriteWithPfm()
  const [pfmText, setPfmText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleApply = useCallback(() => {
    try {
      if (!pfmText.trim()) return
      overwriteWithPfm(pfmText)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid PFM format')
    }
  }, [pfmText, overwriteWithPfm])

  return { pfmText, setPfmText, error, handleApply }
}
