import { useCallback, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'

import { useImportAnimationFrames, useOverwriteWithPixels } from '@/sprites/hooks/useSpriteEditorStore.hook'
import { useAssetsStore } from '@/stores/assets.store'
import { buildAnimationAsset } from '@/lib/animation-job-ledger'
import { pixelBufferToDataUri } from '@/lib/export-utils'
import { base64ToNativePixels } from '@/lib/image-decode'
import { decodeAtNativeSize, decodeSheetAtNativeSize } from '@/lib/sprite-pipeline'
import {
  DEFAULT_ASSET_TYPE,
  SPRITE_ANIMATION,
  SPRITE_IMPORT_MAX_FRAMES,
  SPRITE_IMPORT_MAX_NATIVE_SIZE,
  SPRITE_IMPORT_MIN_FRAMES,
} from '@/constants'
import { FILE_EXTENSION_PATTERN, IMPORT_SPRITE_SHEET_ERRORS } from '@/constants/file-menu'
import type {
  ImportErrorNoticeProps,
  ImportSpriteSheetDialogProps,
  OpenedSpriteSheet,
  PendingSpriteSheet,
  SpriteSheetFileReaders,
  SpriteSheetImportDeps,
  SpriteSheetImportRequest,
  UseImportSpriteSheetReturn,
} from '@/types'

const isValidFrameCount = (frames: number): boolean =>
  Number.isInteger(frames) && frames >= SPRITE_IMPORT_MIN_FRAMES && frames <= SPRITE_IMPORT_MAX_FRAMES

/** Square cells in one row: width / height, when that is a whole, in-range count; otherwise 1. */
export const suggestFrameCount = (width: number, height: number): number => {
  if (height <= 0 || width % height !== 0) return SPRITE_IMPORT_MIN_FRAMES
  const frames = width / height
  return isValidFrameCount(frames) ? frames : SPRITE_IMPORT_MIN_FRAMES
}

export const nameFromFileName = (fileName: string): string => fileName.replace(FILE_EXTENSION_PATTERN, '')

/** First reason the dialog can't import yet, or null when Import is allowed. */
export const validateSpriteSheetImport = (input: {
  readonly name: string
  readonly frames: string
  readonly width: number
}): string | null => {
  if (input.name.trim() === '') return IMPORT_SPRITE_SHEET_ERRORS.NAME_REQUIRED
  const frames = input.frames.trim() === '' ? Number.NaN : Number(input.frames)
  if (!isValidFrameCount(frames)) return IMPORT_SPRITE_SHEET_ERRORS.FRAMES_OUT_OF_RANGE
  if (input.width % frames !== 0) return IMPORT_SPRITE_SHEET_ERRORS.WIDTH_NOT_DIVISIBLE
  return null
}

/**
 * Same flow as the Create tab Import ("Original" size, no quantize): one frame
 * overwrites the canvas, a sheet goes to the timeline. A sheet is also saved to
 * the Assets library as an animation named by the user.
 */
export const runSpriteSheetImport = async (
  request: SpriteSheetImportRequest,
  deps: SpriteSheetImportDeps,
): Promise<void> => {
  if (request.frameCount <= SPRITE_IMPORT_MIN_FRAMES) {
    deps.overwriteWithPixels(await deps.decodeSingle(request.dataUrl), request.dataUrl)
    return
  }

  const frames = await deps.decodeSheet(request.dataUrl, request.frameCount)
  deps.importAnimationFrames(frames, SPRITE_ANIMATION.DEFAULT_FRAME_DURATION_MS)
  deps.addAnimation(
    buildAnimationAsset(
      { label: request.name.trim(), assetType: DEFAULT_ASSET_TYPE },
      frames.map(deps.toDataUri),
      deps.createId(),
      deps.now(),
    ),
  )
}

/**
 * Reads and measures a picked file once, so the dialog can prefill Name and
 * Frames. A read or decode failure becomes a user-facing message instead of
 * only a console entry.
 */
export const openSpriteSheetFile = async (file: File, readers: SpriteSheetFileReaders): Promise<OpenedSpriteSheet> => {
  try {
    const dataUrl = await readers.readAsDataUrl(file)
    const image = await readers.measure(dataUrl)
    return {
      ok: true,
      pending: { dataUrl, width: image.w, height: image.h },
      name: nameFromFileName(file.name),
      frames: String(suggestFrameCount(image.w, image.h)),
    }
  } catch (error) {
    console.error('Failed to read the sprite sheet', error)
    return { ok: false, message: IMPORT_SPRITE_SHEET_ERRORS.OPEN_FAILED }
  }
}

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error(IMPORT_SPRITE_SHEET_ERRORS.READ_FAILED))
    reader.readAsDataURL(file)
  })

const FILE_READERS: SpriteSheetFileReaders = { readAsDataUrl: readFileAsDataUrl, measure: base64ToNativePixels }

const decodeSingle = (dataUrl: string) => decodeAtNativeSize(dataUrl, SPRITE_IMPORT_MAX_NATIVE_SIZE, false)
const decodeSheet = (dataUrl: string, frameCount: number) =>
  decodeSheetAtNativeSize(dataUrl, frameCount, SPRITE_IMPORT_MAX_NATIVE_SIZE, false)

/** File > Import sprite sheet…: hidden file picker, then the Name / Frames dialog. */
export const useImportSpriteSheet = (): UseImportSpriteSheetReturn => {
  const overwriteWithPixels = useOverwriteWithPixels()
  const importAnimationFrames = useImportAnimationFrames()
  const addAnimation = useAssetsStore((state) => state.addAnimation)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<PendingSpriteSheet | null>(null)
  const [name, setName] = useState('')
  const [frames, setFrames] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  const openFilePicker = useCallback(() => fileInputRef.current?.click(), [])
  const dismissFileError = useCallback(() => setFileError(null), [])

  const handleFileSelected = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target
    const file = input.files?.[0]
    // Reset so picking the same file again re-triggers the change event.
    input.value = ''
    if (!file) return

    const opened = await openSpriteSheetFile(file, FILE_READERS)
    if (!opened.ok) {
      setFileError(opened.message)
      return
    }
    setFileError(null)
    setPending(opened.pending)
    setName(opened.name)
    setFrames(opened.frames)
    setImportError(null)
  }, [])

  const handleNameChange = useCallback((event: ChangeEvent<HTMLInputElement>) => setName(event.target.value), [])
  const handleFramesChange = useCallback((event: ChangeEvent<HTMLInputElement>) => setFrames(event.target.value), [])

  const handleCancel = useCallback(() => {
    if (isImporting) return
    setPending(null)
  }, [isImporting])

  const validationError = pending ? validateSpriteSheetImport({ name, frames, width: pending.width }) : null
  const canImport = pending !== null && validationError === null && !isImporting

  const handleConfirm = useCallback(async () => {
    if (!pending || !canImport) return
    setIsImporting(true)
    setImportError(null)
    try {
      await runSpriteSheetImport(
        { dataUrl: pending.dataUrl, name, frameCount: Number(frames) },
        {
          decodeSingle,
          decodeSheet,
          overwriteWithPixels,
          importAnimationFrames,
          addAnimation,
          toDataUri: pixelBufferToDataUri,
          createId: () => crypto.randomUUID(),
          now: Date.now,
        },
      )
      setPending(null)
    } catch (error) {
      console.error('Failed to import the sprite sheet', error)
      setImportError(error instanceof Error ? error.message : IMPORT_SPRITE_SHEET_ERRORS.IMPORT_FAILED)
    } finally {
      setIsImporting(false)
    }
  }, [pending, canImport, name, frames, overwriteWithPixels, importAnimationFrames, addAnimation])

  const dialogProps = useMemo<ImportSpriteSheetDialogProps | null>(
    () =>
      pending
        ? {
            name,
            frames,
            errorMessage: validationError ?? importError,
            canImport,
            isImporting,
            onNameChange: handleNameChange,
            onFramesChange: handleFramesChange,
            onCancel: handleCancel,
            onConfirm: handleConfirm,
          }
        : null,
    [
      pending,
      name,
      frames,
      validationError,
      importError,
      canImport,
      isImporting,
      handleNameChange,
      handleFramesChange,
      handleCancel,
      handleConfirm,
    ],
  )

  const fileErrorProps = useMemo<ImportErrorNoticeProps | null>(
    () => (fileError ? { message: fileError, onDismiss: dismissFileError } : null),
    [fileError, dismissFileError],
  )

  return { fileInputRef, openFilePicker, handleFileSelected, dialogProps, fileErrorProps }
}
