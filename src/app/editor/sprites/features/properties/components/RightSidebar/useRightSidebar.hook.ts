'use client'

import { useState, useCallback, useMemo, useEffect, useRef, type Dispatch, type SetStateAction } from 'react'
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
  usePixelLabApiKey,
  useSetPixelLabApiKey,
  useImportAnimationFrames,
  useLastAIReferenceBase64,
} from '@/app/editor/sprites/hooks/useSpriteEditorStore.hook'
import { generateSpriteWithCodex, decodeToPixels, decodeSheetToFrames } from '@/app/editor/lib/codex-utils'
import {
  parseAnimationHistory,
  persistAnimationHistory,
} from '@/app/editor/lib/animation-history'
import type {
  RgbaColor,
  AnimationAction,
  AnimationDirection,
  AIAnimation,
} from '@/app/editor/types'
import {
  PIXELLAB_ANIMATION,
  AI_SPRITE_DEFAULT_SIZE,
  ANIMATION_SHEET_PROMPT,
  ANIMATION_HISTORY_STORAGE_KEY,
  ANIMATION_HISTORY_LIMIT,
  ANIMATION_PIPELINE_VERSION,
  CODEX_NO_PNG_ERROR,
  SPRITE_IMPORT_DEFAULT_FRAMES,
  SPRITE_IMPORT_MIN_FRAMES,
  SPRITE_IMPORT_MAX_FRAMES,
} from '@/app/editor/constants'

export type { AIAnimation } from '@/app/editor/types'

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


export interface UseSpriteImportReturn {
  frameCount: number
  setFrameCount: (value: number) => void
  size: number
  setSize: Dispatch<SetStateAction<number>>
  isSheet: boolean
  isImporting: boolean
  error: string | null
  fileInputRef: React.RefObject<HTMLInputElement | null>
  handleOpenFilePicker: () => void
  handleFileSelected: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>
}

/**
 * Manual sprite import. Engine-style: the user DECLARES how many frames the
 * uploaded PNG holds and the pipeline obeys — we never auto-detect frames.
 * Quantization is always disabled because the image is already hand-edited;
 * re-quantizing would destroy the user's palette.
 */
export const useSpriteImport = (): UseSpriteImportReturn => {
  const overwriteWithPixels = useOverwriteWithPixels()
  const importAnimationFrames = useImportAnimationFrames()

  const [frameCount, setFrameCountState] = useState<number>(SPRITE_IMPORT_DEFAULT_FRAMES)
  const [size, setSize] = useState<number>(AI_SPRITE_DEFAULT_SIZE)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const setFrameCount = useCallback((value: number) => {
    if (Number.isNaN(value)) {
      setFrameCountState(SPRITE_IMPORT_MIN_FRAMES)
      return
    }
    const clamped = Math.min(
      SPRITE_IMPORT_MAX_FRAMES,
      Math.max(SPRITE_IMPORT_MIN_FRAMES, Math.floor(value))
    )
    setFrameCountState(clamped)
  }, [])

  const handleOpenFilePicker = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const readFileAsDataUrl = useCallback(
    (file: File): Promise<string> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error('No se pudo leer el archivo.'))
        reader.readAsDataURL(file)
      }),
    []
  )

  const handleFileSelected = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const input = event.target
      const file = input.files?.[0]
      if (!file) return

      try {
        setIsImporting(true)
        setError(null)

        const dataUrl = await readFileAsDataUrl(file)

        if (frameCount <= SPRITE_IMPORT_MIN_FRAMES) {
          // Single sprite — quantize=false keeps the user's hand-cleaned palette.
          const pixels = await decodeToPixels(dataUrl, size, false)
          overwriteWithPixels(pixels, dataUrl)
        } else {
          // Multi-frame sheet — the user declares the frame count; no auto-detect.
          const frames = await decodeSheetToFrames(dataUrl, frameCount, size, false)
          importAnimationFrames(frames, PIXELLAB_ANIMATION.DEFAULT_FRAME_DURATION_MS)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudo importar el sprite.')
      } finally {
        setIsImporting(false)
        // Reset so selecting the same file again re-triggers the change event.
        input.value = ''
      }
    },
    [frameCount, size, overwriteWithPixels, importAnimationFrames, readFileAsDataUrl]
  )

  // Single rule for "does this PNG hold an animation sheet?" — kept here so the
  // JSX never re-derives the frame threshold and the two can't drift apart.
  const isSheet = frameCount > SPRITE_IMPORT_MIN_FRAMES

  return {
    frameCount,
    setFrameCount,
    size,
    setSize,
    isSheet,
    isImporting,
    error,
    fileInputRef,
    handleOpenFilePicker,
    handleFileSelected,
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
        // downscales to the user-selected grid size and quantizes the
        // palette. Quantization always runs — product decision, not a
        // user-toggleable option. overwriteWithPixels re-sizes the canvas
        // in the store based on the pixel array length.
        const pixels = await decodeToPixels(gen.base64, genSize, true)
        overwriteWithPixels(pixels, gen.base64)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to re-apply generation')
      } finally {
        setIsLoading(false)
      }
    },
    [overwriteWithPixels, genSize]
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
    downloadImage,
    downloadSource,
    apiKey,
    tempApiKey,
    setTempApiKey,
    handleSaveApiKey
  }
}

export interface UseAnimationGeneratorReturn {
  action: AnimationAction
  setAction: Dispatch<SetStateAction<AnimationAction>>
  direction: AnimationDirection
  setDirection: Dispatch<SetStateAction<AnimationDirection>>
  nFrames: number
  setNFrames: Dispatch<SetStateAction<number>>
  isGenerating: boolean
  animError: string | null
  handleGenerateAnimation: () => Promise<void>
  previewRef: string | null
  handlePreviewReference: () => Promise<void>
  animations: AIAnimation[]
  handleSelectAnimation: (anim: AIAnimation) => Promise<void>
  downloadAnimationSheet: (anim: AIAnimation) => void
  sheetsAvailableForDownload: Set<string>
}

export const useAnimationGenerator = (): UseAnimationGeneratorReturn => {
  const importAnimationFrames = useImportAnimationFrames()
  const layers = useSpriteEditorStore((s) => s.layers)
  const lastAIReferenceBase64 = useLastAIReferenceBase64()

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
  const [animations, setAnimations] = useState<AIAnimation[]>([])
  const [isAnimationHistoryHydrated, setIsAnimationHistoryHydrated] = useState(false)

  // Raw Codex sheet, kept in-memory only (never localStorage — a multi-frame
  // sheet's base64 can run several MB and would blow the shared localStorage
  // quota used by pixellab_history + animation history). Available only for
  // animations generated in the current session; lost on reload.
  const sheetCacheRef = useRef<Map<string, string>>(new Map())
  const [sheetsAvailableForDownload, setSheetsAvailableForDownload] = useState<Set<string>>(new Set())

  // Load animation history from localStorage on mount
  useEffect(() => {
    try {
      const result = parseAnimationHistory(
        localStorage.getItem(ANIMATION_HISTORY_STORAGE_KEY),
      )
      setAnimations(result.animations)
      if (result.requiresRewrite) {
        persistAnimationHistory(localStorage, result.animations)
      }
    } catch (e) {
      console.error('Failed to load animation history', e)
    } finally {
      setIsAnimationHistoryHydrated(true)
    }
  }, [])

  // Persist animation history to localStorage when it changes
  useEffect(() => {
    if (!isAnimationHistoryHydrated) return

    try {
      persistAnimationHistory(localStorage, animations)
    } catch (e) {
      console.error('Failed to persist animation history', e)
    }
  }, [animations, isAnimationHistoryHydrated])

  const handlePreviewReference = useCallback(async () => {
    if (lastAIReferenceBase64) {
      setPreviewRef(lastAIReferenceBase64)
      return
    }
    const { layersToBase64 } = await import('@/app/editor/lib/export-utils')
    const ref = layersToBase64(AI_SPRITE_DEFAULT_SIZE, AI_SPRITE_DEFAULT_SIZE, layers)
    setPreviewRef(ref)
  }, [layers, lastAIReferenceBase64])

  const handleGenerateAnimation = useCallback(async () => {
    try {
      setIsGenerating(true)
      setAnimError(null)

      const { layersToBase64, pixelBufferToDataUri } = await import('@/app/editor/lib/export-utils')
      // Prefer the native-resolution AI generation over a re-render of the
      // (already downscaled/quantized) canvas — Codex gets full detail to
      // anchor the animation to, instead of a lossier copy of itself.
      const referenceBase64 =
        lastAIReferenceBase64 ?? layersToBase64(AI_SPRITE_DEFAULT_SIZE, AI_SPRITE_DEFAULT_SIZE, layers)

      if (!referenceBase64) {
        setAnimError('No se pudo exportar el frame actual como referencia.')
        return
      }

      const prompt = ANIMATION_SHEET_PROMPT(action, direction, nFrames)
      // prependBase=false: the single-sprite base prompt ("64x64 sprite, full body
      // centered") contradicts a multi-frame sheet. ANIMATION_SHEET_PROMPT is
      // self-contained (palette, no-AA, transparent bg, retro style).
      // Keep the generated palette intact for animation frames. Nearest-neighbour
      // normalization preserves the small facial/costume details that per-frame
      // 16-colour quantization was collapsing.
      const { base64 } = await generateSpriteWithCodex(prompt, referenceBase64, false)
      const frames = await decodeSheetToFrames(
        base64,
        nFrames,
        AI_SPRITE_DEFAULT_SIZE,
        false,
        referenceBase64,
      )

      importAnimationFrames(frames, PIXELLAB_ANIMATION.DEFAULT_FRAME_DURATION_MS)

      // Store history as already-cropped, small PNG data-URIs (64x64 each),
      // never the raw ~1MB sheet — keeps localStorage light and thumbnails clean.
      const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)
      const newAnimation: AIAnimation = {
        pipelineVersion: ANIMATION_PIPELINE_VERSION,
        id: crypto.randomUUID(),
        label: `${capitalize(action)} · ${capitalize(direction)}`,
        frames: frames.map((frame) => pixelBufferToDataUri(frame)),
        frameDurationMs: PIXELLAB_ANIMATION.DEFAULT_FRAME_DURATION_MS,
        timestamp: Date.now(),
      }
      setAnimations((prev) => [newAnimation, ...prev].slice(0, ANIMATION_HISTORY_LIMIT))
      sheetCacheRef.current.set(newAnimation.id, base64)
      setSheetsAvailableForDownload((prev) => new Set(prev).add(newAnimation.id))
    } catch (e) {
      const message = e instanceof Error ? e.message : ''
      setAnimError(
        message.includes(CODEX_NO_PNG_ERROR)
          ? 'La generación fue bloqueada o no produjo imagen, reintentá o cambiá el prompt.'
          : message || 'La generación de la animación falló.'
      )
    } finally {
      setIsGenerating(false)
    }
  }, [action, direction, nFrames, layers, lastAIReferenceBase64, importAnimationFrames])

  const handleSelectAnimation = useCallback(
    async (anim: AIAnimation) => {
      try {
        setIsGenerating(true)
        setAnimError(null)

        const decodedFrames = await Promise.all(
          anim.frames.map((dataUri) => decodeToPixels(dataUri, AI_SPRITE_DEFAULT_SIZE, false))
        )
        importAnimationFrames(decodedFrames, anim.frameDurationMs)
      } catch (e) {
        setAnimError(e instanceof Error ? e.message : 'No se pudo cargar la animación guardada.')
      } finally {
        setIsGenerating(false)
      }
    },
    [importAnimationFrames]
  )

  const downloadAnimationSheet = useCallback((anim: AIAnimation) => {
    const sheet = sheetCacheRef.current.get(anim.id)
    if (!sheet) return
    const link = document.createElement('a')
    link.href = sheet
    link.download = `codex-animation-${anim.label.replace(/\s+/g, '-').toLowerCase()}-${anim.timestamp}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])

  return {
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
    animations,
    handleSelectAnimation,
    downloadAnimationSheet,
    sheetsAvailableForDownload,
  }
}
