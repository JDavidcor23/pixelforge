import { useState, useCallback } from 'react'
import { useSoundsStore } from '@/stores/sounds.store'
import { uploadAudio } from '../../services/audio-storage.service'
import type { AudioAsset, AudioAssetTag } from '@/types/audio'

interface UseImportDialogParams {
  audioBlob: Blob
  audioDuration: number
  onClose: () => void
}

export function useImportDialog({ audioBlob, audioDuration, onClose }: UseImportDialogParams) {
  const addAsset = useSoundsStore((state) => state.addAsset)

  const [name, setName] = useState('')
  const [selectedTags, setSelectedTags] = useState<AudioAssetTag[]>([])
  const [spriteId, setSpriteId] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTagToggle = useCallback((tag: AudioAssetTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }, [])

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      setError('Name is required')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const userId = 'local-user'
      const associatedSpriteIds = spriteId.trim() ? [spriteId.trim()] : []

      const { url } = await uploadAudio(userId, name, audioBlob, {
        name,
        tags: selectedTags,
        duration: audioDuration,
        format: 'audio/wav',
        fileSize: audioBlob.size,
        associatedSpriteIds,
      })

      const newAsset: AudioAsset = {
        id: crypto.randomUUID(),
        name: name.trim(),
        tags: selectedTags,
        duration: audioDuration,
        format: 'audio/wav',
        fileSize: audioBlob.size,
        supabaseUrl: url,
        localObjectUrl: URL.createObjectURL(audioBlob),
        associatedSpriteIds,
        createdAt: new Date().toISOString(),
      }

      addAsset(newAsset)
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      setError(message)
    } finally {
      setIsUploading(false)
    }
  }, [name, selectedTags, spriteId, audioBlob, audioDuration, addAsset, onClose])

  const isValid = name.trim().length > 0

  return {
    name,
    setName,
    selectedTags,
    handleTagToggle,
    spriteId,
    setSpriteId,
    isUploading,
    error,
    isValid,
    handleSave,
  }
}
