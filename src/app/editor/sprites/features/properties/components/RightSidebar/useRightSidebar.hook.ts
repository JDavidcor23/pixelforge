'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { colord } from 'colord'

import {
  useActiveLayerId,
  useActiveLayerOpacity,
  useSetLayerOpacity,
  usePrimaryColor,
  useSecondaryColor,
  useSetPrimaryColor,
  useSetSecondaryColor,
  useOverwriteWithPixels,
  useSpriteEditorStore,
  useCanvasDimensions
} from '@/app/editor/sprites/hooks/useSpriteEditorStore.hook'
import type { RgbaColor } from '@/app/editor/types'

export interface AIGeneration {
  id: string
  prompt: string
  base64: string
  timestamp: number
  width: number
  height: number
}

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


export const usePixelLabCopilot = () => {
  const overwriteWithPixels = useOverwriteWithPixels()
  const { width: canvasWidth, height: canvasHeight } = useCanvasDimensions()

  const [prompt, setPrompt] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [genSize, setGenSize] = useState(32)
  const [generations, setGenerations] = useState<AIGeneration[]>([])

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('pixellab_history')
    if (saved) {
      try {
        setGenerations(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load history', e)
      }
    }
  }, [])

  // Persist history to localStorage when it changes
  useEffect(() => {
    if (generations.length > 0) {
      localStorage.setItem('pixellab_history', JSON.stringify(generations))
    }
  }, [generations])

  const addToHistory = useCallback((newGen: Omit<AIGeneration, 'id' | 'timestamp'>) => {
    setGenerations((prev) => {
      // Ensure base64 has prefix for <img> tag preview
      const sanitizedBase64 = newGen.base64.startsWith('data:') 
        ? newGen.base64 
        : `data:image/png;base64,${newGen.base64}`

      const next = [
        {
          ...newGen,
          base64: sanitizedBase64,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        },
        ...prev,
      ]
      return next.slice(0, 10) // Limit to 10 generations
    })
  }, [])

  const handleSelectGeneration = useCallback(
    async (gen: AIGeneration) => {
      try {
        setIsLoading(true)
        setError(null)
        
        const { base64ToPixels } = await import('@/app/editor/lib/pixellab-utils')
        
        // THE TRANSFORMER: Works on the generation's native dimensions.
        // overwriteWithPixels will automatically re-size the canvas in the store
        // based on the pixel array length.
        const pixels = await base64ToPixels(gen.base64, gen.width, gen.height)
        overwriteWithPixels(pixels)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to re-apply generation')
      } finally {
        setIsLoading(false)
      }
    },
    [overwriteWithPixels]
  )

  const handleApply = useCallback(async () => {
    try {
      if (!prompt.trim()) return
      setIsLoading(true)
      setError(null)
      const { generateSpriteWithPixelLab } = await import(
        '@/app/editor/lib/pixellab-utils'
      )
      
      // Request using the user-selected size
      const base64 = await generateSpriteWithPixelLab(prompt, genSize, genSize)

      // Add to history with metadata
      addToHistory({ prompt, base64, width: genSize, height: genSize })
      
      setPrompt('') // Clear prompt after generation
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      setIsLoading(false)
    }
  }, [prompt, genSize, addToHistory])

  const downloadImage = useCallback((gen: AIGeneration) => {
    const link = document.createElement('a')
    link.href = gen.base64
    link.download = `pixellab-${gen.prompt.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])

  const downloadSource = useCallback((gen: AIGeneration) => {
    const data = JSON.stringify({
      prompt: gen.prompt,
      width: gen.width,
      height: gen.height,
      timestamp: new Date(gen.timestamp).toISOString(),
      base64: gen.base64
    }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `pixellab-${gen.id}-source.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  return { 
    prompt, 
    setPrompt, 
    error, 
    isLoading, 
    handleApply, 
    generations, 
    handleSelectGeneration,
    genSize,
    setGenSize,
    downloadImage,
    downloadSource
  }
}

export const useDemoSprite = () => {
  const overwriteWithPixels = useOverwriteWithPixels()
  const canvasWidth = useSpriteEditorStore((s) => s.canvasWidth)
  const canvasHeight = useSpriteEditorStore((s) => s.canvasHeight)
  const [isLoading, setIsLoading] = useState(false)

  const handleInject = useCallback(async () => {
    try {
      setIsLoading(true)
      const { PIXELLAB_DEMO_BASE64 } = await import('@/app/editor/constants/DEMO_SPRITE')
      const { base64ToPixels } = await import('@/app/editor/lib/pixellab-utils')
      const pixels = await base64ToPixels(PIXELLAB_DEMO_BASE64, canvasWidth, canvasHeight)
      overwriteWithPixels(pixels)
    } catch (e) {
      console.error('Demo injection failed', e)
    } finally {
      setIsLoading(false)
    }
  }, [overwriteWithPixels, canvasWidth, canvasHeight])

  return { handleInject, isLoading }
}
