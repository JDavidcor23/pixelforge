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
  useImportAnimationFrames,
  useLastAIReferenceBase64,
  useRetroDiffusionApiKey,
  useSetRetroDiffusionApiKey,
} from '@/app/editor/sprites/hooks/useSpriteEditorStore.hook'
import { decodeToPixels, decodeSheetToFrames } from '@/app/editor/lib/sprite-pipeline'
import {
  generateSpriteWithRetroDiffusion,
  generateAnimationWithRetroDiffusion,
  decodeGeneratedSprite,
  sliceAnimationSheet,
} from '@/app/editor/lib/retro-diffusion-utils'
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
  SPRITE_ANIMATION,
  AI_SPRITE_DEFAULT_SIZE,
  ANIMATION_HISTORY_STORAGE_KEY,
  GENERATION_HISTORY_STORAGE_KEY,
  ANIMATION_HISTORY_LIMIT,
  ANIMATION_PIPELINE_VERSION,
  RETRO_DIFFUSION_DEFAULT_STYLE,
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
          importAnimationFrames(frames, SPRITE_ANIMATION.DEFAULT_FRAME_DURATION_MS)
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

export const useSpriteCopilot = () => {
  const overwriteWithPixels = useOverwriteWithPixels()
  // BYOK: this is the user's own Retro Diffusion token. Left empty, the server
  // falls back to API_RETRO_DIFFUSION.
  const apiKey = useRetroDiffusionApiKey()
  const setApiKey = useSetRetroDiffusionApiKey()

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
  // Surfaced so a BYOK user can see what each generation cost them and how much
  // balance is left, instead of discovering it on the Retro Diffusion dashboard.
  const [lastCostUsd, setLastCostUsd] = useState<number | null>(null)
  const [remainingBalanceUsd, setRemainingBalanceUsd] = useState<number | null>(null)

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(GENERATION_HISTORY_STORAGE_KEY)
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
      localStorage.setItem(GENERATION_HISTORY_STORAGE_KEY, JSON.stringify(generations))
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

        // Retro Diffusion generations already come back at the grid size with
        // real alpha, so decodeGeneratedSprite uses them verbatim. Legacy Codex
        // history entries (high-res, opaque background) still fall through to
        // the chroma-key + downscale + quantize path inside it.
        const pixels = await decodeGeneratedSprite(gen.base64, genSize)
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

      // Retro Diffusion is given the grid size directly and answers with a true
      // RGBA PNG at exactly that resolution, so nothing has to be keyed,
      // downscaled or quantized afterwards.
      const { base64, width, height, costUsd, remainingBalanceUsd: balance } =
        await generateSpriteWithRetroDiffusion({
          prompt,
          width: genSize,
          height: genSize,
          style: RETRO_DIFFUSION_DEFAULT_STYLE,
          apiKey: apiKey ?? undefined,
        })

      addToHistory({ prompt, base64, width, height })
      setLastCostUsd(costUsd)
      setRemainingBalanceUsd(balance)

      setPrompt('') // Clear prompt after generation
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      setIsLoading(false)
    }
  }, [prompt, addToHistory, genSize, apiKey])

  const downloadImage = useCallback((gen: AIGeneration) => {
    const link = document.createElement('a')
    link.href = gen.base64
    link.download = `sprite-${gen.prompt.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.png`
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
    link.download = `sprite-${gen.id}-source.json`
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
    handleSaveApiKey,
    lastCostUsd,
    remainingBalanceUsd
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
  const retroDiffusionApiKey = useRetroDiffusionApiKey()

  const [action, setAction] = useState<AnimationAction>(
    SPRITE_ANIMATION.DEFAULT_ACTION as AnimationAction
  )
  const [direction, setDirection] = useState<AnimationDirection>(
    SPRITE_ANIMATION.DEFAULT_DIRECTION as AnimationDirection
  )
  const [nFrames, setNFrames] = useState<number>(SPRITE_ANIMATION.DEFAULT_N_FRAMES)
  const [isGenerating, setIsGenerating] = useState(false)
  const [animError, setAnimError] = useState<string | null>(null)
  const [previewRef, setPreviewRef] = useState<string | null>(null)
  const [animations, setAnimations] = useState<AIAnimation[]>([])
  const [isAnimationHistoryHydrated, setIsAnimationHistoryHydrated] = useState(false)

  // Raw animation sheet, kept in-memory only (never localStorage — a multi-frame
  // sheet's base64 can run several MB and would blow the quota shared with the
  // generation and animation histories). Available only for animations made in
  // the current session; lost on reload.
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
      // (already downscaled/quantized) canvas — the model gets full detail to
      // anchor the animation to, instead of a lossier copy of itself.
      const referenceBase64 =
        lastAIReferenceBase64 ?? layersToBase64(AI_SPRITE_DEFAULT_SIZE, AI_SPRITE_DEFAULT_SIZE, layers)

      if (!referenceBase64) {
        setAnimError('No se pudo exportar el frame actual como referencia.')
        return
      }

      // Retro Diffusion takes the reference as a real parameter (input_image),
      // which is what attaching a file via `codex -i` was trying to approximate,
      // and answers with an exact grid sheet — so the frames are cut by division
      // instead of by detecting gaps between poses.
      const { base64 } = await generateAnimationWithRetroDiffusion(
        action,
        direction,
        nFrames,
        AI_SPRITE_DEFAULT_SIZE,
        referenceBase64,
        retroDiffusionApiKey ?? undefined,
      )
      const frames = await sliceAnimationSheet(base64, AI_SPRITE_DEFAULT_SIZE, nFrames)

      if (frames.length === 0) {
        setAnimError('La hoja de animación llegó vacía o con un tamaño inesperado.')
        return
      }

      importAnimationFrames(frames, SPRITE_ANIMATION.DEFAULT_FRAME_DURATION_MS)

      // Store history as already-cropped, small PNG data-URIs (64x64 each),
      // never the raw ~1MB sheet — keeps localStorage light and thumbnails clean.
      const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)
      const newAnimation: AIAnimation = {
        pipelineVersion: ANIMATION_PIPELINE_VERSION,
        id: crypto.randomUUID(),
        label: `${capitalize(action)} · ${capitalize(direction)}`,
        frames: frames.map((frame) => pixelBufferToDataUri(frame)),
        frameDurationMs: SPRITE_ANIMATION.DEFAULT_FRAME_DURATION_MS,
        timestamp: Date.now(),
      }
      setAnimations((prev) => [newAnimation, ...prev].slice(0, ANIMATION_HISTORY_LIMIT))
      sheetCacheRef.current.set(newAnimation.id, base64)
      setSheetsAvailableForDownload((prev) => new Set(prev).add(newAnimation.id))
    } catch (e) {
      const message = e instanceof Error ? e.message : ''
      setAnimError(message || 'La generación de la animación falló.')
    } finally {
      setIsGenerating(false)
    }
  }, [
    action,
    direction,
    nFrames,
    layers,
    lastAIReferenceBase64,
    importAnimationFrames,
    retroDiffusionApiKey,
  ])

  const handleSelectAnimation = useCallback(
    async (anim: AIAnimation) => {
      try {
        setIsGenerating(true)
        setAnimError(null)

        // Saved frames were already stored at grid size, so this is a verbatim
        // decode — no keying, no rescale.
        const decodedFrames = await Promise.all(
          anim.frames.map((dataUri) => decodeGeneratedSprite(dataUri, AI_SPRITE_DEFAULT_SIZE))
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
    link.download = `animation-${anim.label.replace(/\s+/g, '-').toLowerCase()}-${anim.timestamp}.png`
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
