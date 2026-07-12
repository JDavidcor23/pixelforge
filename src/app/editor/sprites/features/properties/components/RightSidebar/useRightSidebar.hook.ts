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
  useCanvasDimensions,
  usePixelLabApiKey,
  useSetPixelLabApiKey,
  useImportAnimationFrames,
} from '@/app/editor/sprites/hooks/useSpriteEditorStore.hook'
import { generateSpriteWithCodex, decodeToPixels } from '@/app/editor/lib/codex-utils'
import type { RgbaColor, AnimationAction, AnimationDirection } from '@/app/editor/types'
import { PIXELLAB_ANIMATION, AI_SPRITE_DEFAULT_SIZE } from '@/app/editor/constants'

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
  const apiKey = usePixelLabApiKey()
  const setApiKey = useSetPixelLabApiKey()

  const [tempApiKey, setTempApiKey] = useState(apiKey || '')
  const [prompt, setPrompt] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Sync temp key with store on mount or if store changes elsewhere
  useEffect(() => {
    setTempApiKey(apiKey || '')
  }, [apiKey])

  const handleSaveApiKey = useCallback(() => {
    setApiKey(tempApiKey.trim() || null)
  }, [tempApiKey, setApiKey])
  const [isLoading, setIsLoading] = useState(false)
  const [genSize, setGenSize] = useState<number>(AI_SPRITE_DEFAULT_SIZE)
  const [quantizeEnabled, setQuantizeEnabled] = useState(true)
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

        // Codex returns high-res images (e.g. 1254x1254). decodeToPixels
        // downscales to the user-selected grid size and optionally quantizes
        // the palette. overwriteWithPixels re-sizes the canvas in the store
        // based on the pixel array length.
        const pixels = await decodeToPixels(gen.base64, genSize, quantizeEnabled)
        overwriteWithPixels(pixels)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to re-apply generation')
      } finally {
        setIsLoading(false)
      }
    },
    [overwriteWithPixels, genSize, quantizeEnabled]
  )

  const handleApply = useCallback(async () => {
    try {
      if (!prompt.trim()) return
      setIsLoading(true)
      setError(null)

      // Codex agent loop — returns a high-res image with its native dimensions
      const { base64, width, height } = await generateSpriteWithCodex(prompt)

      // Store the native resolution; downscaling happens on selection
      addToHistory({ prompt, base64, width, height })

      setPrompt('') // Clear prompt after generation
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      setIsLoading(false)
    }
  }, [prompt, addToHistory])

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
    quantizeEnabled,
    setQuantizeEnabled,
    downloadImage,
    downloadSource,
    apiKey,
    tempApiKey,
    setTempApiKey,
    handleSaveApiKey
  }
}

export const useAnimationGenerator = () => {
  const importAnimationFrames = useImportAnimationFrames()
  const { width: canvasWidth, height: canvasHeight } = useCanvasDimensions()
  const layers = useSpriteEditorStore((s) => s.layers)
  const apiKey = usePixelLabApiKey()

  const [description, setDescription] = useState('')
  const [action, setAction] = useState<AnimationAction>(
    PIXELLAB_ANIMATION.DEFAULT_ACTION as AnimationAction
  )
  const [direction, setDirection] = useState<AnimationDirection>(
    PIXELLAB_ANIMATION.DEFAULT_DIRECTION as AnimationDirection
  )
  const [nFrames, setNFrames] = useState<number>(PIXELLAB_ANIMATION.DEFAULT_N_FRAMES)
  const [isGenerating, setIsGenerating] = useState(false)
  const [animError, setAnimError] = useState<string | null>(null)
  const [previewRef, setPreviewRef] = useState<string | null>(null)

  const handlePreviewReference = useCallback(async () => {
    const { layersToBase64 } = await import('@/app/editor/lib/export-utils')
    const ref = layersToBase64(64, 64, layers)
    setPreviewRef(ref)
  }, [layers])

  const handleGenerateAnimation = useCallback(async () => {
    try {
      if (!description.trim()) return
      setIsGenerating(true)
      setAnimError(null)

      const { layersToBase64 } = await import('@/app/editor/lib/export-utils')
      const { generateAnimationWithPixelLab, base64ToPixels } = await import('@/app/editor/lib/pixellab-utils')
      
      const base64 = layersToBase64(64, 64, layers)

      if (!base64) {
        setAnimError('Failed to export current frame.')
        return
      }

      const response = await generateAnimationWithPixelLab({
        description,
        action,
        direction,
        view: 'side',
        image_size: { width: 64, height: 64 },
        reference_image: { type: 'base64', base64 },
        n_frames: nFrames,
        apiKey,
      } as any)

      const pixelFrames = await Promise.all(
        response.images.map((image: any) => base64ToPixels(image.base64, 64, 64))
      )

      importAnimationFrames(pixelFrames, PIXELLAB_ANIMATION.DEFAULT_FRAME_DURATION_MS)
    } catch (e) {
      setAnimError(e instanceof Error ? e.message : 'Animation generation failed')
    } finally {
      setIsGenerating(false)
    }
  }, [description, action, direction, nFrames, layers, apiKey, importAnimationFrames])

  return {
    description,
    setDescription,
    action,
    setAction,
    direction,
    setDirection,
    nFrames,
    setNFrames,
    isGenerating,
    animError,
    handleGenerateAnimation,
    previewRef,
    handlePreviewReference,
    apiKey,
  }
}
