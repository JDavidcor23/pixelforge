import { useCallback, useId, useRef, useState } from 'react'

import { useAddToTimeline } from '@/sounds/hooks/useAddToTimeline.hook'
import { useCreateSound } from '@/sounds/hooks/useCreateSound.hook'
import {
  IMPORT_ACCEPT,
  IMPORT_ALLOWED_EXTENSIONS,
  IMPORT_ALLOWED_MIME_TYPES,
  SOUND_LIBRARY_ERRORS,
} from '@/constants/sound-library'
import { FILES_DRAG_TYPE, SOUND_DRAG_MIME } from '@/constants/timeline-view'

function isSupportedFile(file: File): boolean {
  const lowerName = file.name.toLowerCase()
  return (
    IMPORT_ALLOWED_MIME_TYPES.includes(file.type) ||
    IMPORT_ALLOWED_EXTENSIONS.some((extension) => lowerName.endsWith(extension))
  )
}

const isAcceptedDrag = (event: React.DragEvent): boolean =>
  event.dataTransfer.types.includes(SOUND_DRAG_MIME) || event.dataTransfer.types.includes(FILES_DRAG_TYPE)

/**
 * The "Add track" row's drop target: library sounds land on their kind's
 * track (appended), audio files are imported into the library first.
 */
export function useDropZone() {
  const inputRef = useRef<HTMLInputElement>(null)
  const errorId = useId()
  const [isDragOver, setIsDragOver] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { addToTimeline } = useAddToTimeline()
  const { importFile } = useCreateSound()

  const importAndAdd = useCallback(
    async (file: File) => {
      if (!isSupportedFile(file)) {
        setError(SOUND_LIBRARY_ERRORS.UNSUPPORTED_IMPORT)
        return
      }
      setError(null)
      setIsImporting(true)
      try {
        const asset = await importFile(file)
        addToTimeline(asset.id)
      } catch (importError) {
        console.error('Failed to import audio file:', importError)
        setError(SOUND_LIBRARY_ERRORS.UNSUPPORTED_IMPORT)
      } finally {
        setIsImporting(false)
      }
    },
    [importFile, addToTimeline]
  )

  const handleOpenPicker = useCallback(() => inputRef.current?.click(), [])

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      // Reset so picking the same file again still fires `change`.
      event.target.value = ''
      if (file) void importAndAdd(file)
    },
    [importAndAdd]
  )

  const handleDragOver = useCallback((event: React.DragEvent<HTMLButtonElement>) => {
    if (!isAcceptedDrag(event)) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLButtonElement>) => {
    // Moving onto the zone's own icon/text is not leaving it.
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLButtonElement>) => {
      setIsDragOver(false)
      if (!isAcceptedDrag(event)) return
      event.preventDefault()
      const assetId = event.dataTransfer.getData(SOUND_DRAG_MIME)
      if (assetId) {
        addToTimeline(assetId)
        return
      }
      const file = event.dataTransfer.files[0]
      if (file) void importAndAdd(file)
    },
    [addToTimeline, importAndAdd]
  )

  return {
    inputRef,
    errorId,
    error,
    isDragOver,
    isImporting,
    accept: IMPORT_ACCEPT,
    handleOpenPicker,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  }
}
