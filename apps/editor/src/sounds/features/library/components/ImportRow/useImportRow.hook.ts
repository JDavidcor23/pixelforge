import { useCallback, useId, useRef, useState } from 'react'

import { useSoundsStore } from '@/stores/sounds.store'
import { useCreateSound } from '@/sounds/hooks/useCreateSound.hook'
import {
  IMPORT_ACCEPT,
  IMPORT_ALLOWED_EXTENSIONS,
  IMPORT_ALLOWED_MIME_TYPES,
  SOUND_LIBRARY_ERRORS,
} from '@/constants/sound-library'

function isSupportedFile(file: File): boolean {
  const lowerName = file.name.toLowerCase()
  return (
    IMPORT_ALLOWED_MIME_TYPES.includes(file.type) ||
    IMPORT_ALLOWED_EXTENSIONS.some((extension) => lowerName.endsWith(extension))
  )
}

export function useImportRow() {
  const inputRef = useRef<HTMLInputElement>(null)
  const errorId = useId()
  const [error, setError] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  const closeNewSound = useSoundsStore((state) => state.closeNewSound)
  const { importFile } = useCreateSound()

  const handleOpenPicker = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      // Reset so picking the same file again still fires `change`.
      event.target.value = ''
      if (!file) return

      if (!isSupportedFile(file)) {
        setError(SOUND_LIBRARY_ERRORS.UNSUPPORTED_IMPORT)
        return
      }

      setError(null)
      setIsImporting(true)
      try {
        await importFile(file)
        closeNewSound()
      } catch (importError) {
        console.error('Failed to import audio file:', importError)
        setError(SOUND_LIBRARY_ERRORS.UNSUPPORTED_IMPORT)
      } finally {
        setIsImporting(false)
      }
    },
    [importFile, closeNewSound]
  )

  return {
    inputRef,
    errorId,
    error,
    isImporting,
    accept: IMPORT_ACCEPT,
    handleOpenPicker,
    handleFileChange,
  }
}
