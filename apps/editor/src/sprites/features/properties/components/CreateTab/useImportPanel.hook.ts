import { useCallback, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'

import {
  useImportAnimationFrames,
  useOverwriteWithPixels,
} from '@/sprites/hooks/useSpriteEditorStore.hook'
import { decodeSheetToFrames, decodeToPixels } from '@/lib/sprite-pipeline'
import {
  AI_SPRITE_DEFAULT_SIZE,
  SPRITE_ANIMATION,
  SPRITE_IMPORT_DEFAULT_FRAMES,
  SPRITE_IMPORT_MAX_FRAMES,
  SPRITE_IMPORT_MIN_FRAMES,
} from '@/constants'

export interface UseImportPanelReturn {
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
export const useImportPanel = (): UseImportPanelReturn => {
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
      Math.max(SPRITE_IMPORT_MIN_FRAMES, Math.floor(value)),
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
        reader.onerror = () => reject(new Error('Could not read the file.'))
        reader.readAsDataURL(file)
      }),
    [],
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
        setError(e instanceof Error ? e.message : 'Could not import the sprite.')
      } finally {
        setIsImporting(false)
        // Reset so selecting the same file again re-triggers the change event.
        input.value = ''
      }
    },
    [frameCount, size, overwriteWithPixels, importAnimationFrames, readFileAsDataUrl],
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
