import { useCallback, useEffect, useRef, useState } from 'react'

import { useSoundsStore } from '@/stores/sounds.store'
import { useCreateSound } from '@/sounds/hooks/useCreateSound.hook'
import { useDeleteSound } from '@/sounds/hooks/useDeleteSound.hook'
import { audioBufferCache } from '@/lib/audio-buffer-cache'
import { encodeWav } from '@/lib/audio-encoder'
import { downloadBlob } from '@/lib/export-utils'
import {
  buildUniqueName,
  formatDuration,
  getAssetKindLabel,
  splitNameForTruncation,
} from '@/lib/sound-assets'
import {
  NAME_VISIBLE_TAIL_LENGTH,
  PRESET_TILES,
  SOUND_LIBRARY_ERRORS,
  SOUND_NAME_MAX_LENGTH,
  WAV_EXTENSION,
} from '@/constants/sound-library'
import type { AudioAsset, AudioAssetSource } from '@/types/audio'

function buildMeta(asset: AudioAsset, source: AudioAssetSource): string {
  const duration = formatDuration(asset.duration)
  switch (source) {
    case 'synth': {
      const preset = PRESET_TILES.find((tile) => tile.presetId === asset.presetId)
      return preset
        ? `${duration} · built with synth from “${preset.label}”`
        : `${duration} · built with synth`
    }
    case 'ai':
      return `${duration} · made with AI`
    case 'import':
      return `${duration} · imported`
  }
}

export function useSoundDetailHeader(asset: AudioAsset, source: AudioAssetSource) {
  const renameButtonRef = useRef<HTMLButtonElement>(null)
  const wasRenamingRef = useRef(false)
  // Escape unmounts the input; a trailing blur must not save the draft.
  const isCancellingRef = useRef(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [draftName, setDraftName] = useState(asset.name)
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const assets = useSoundsStore((state) => state.assets)
  const updateAsset = useSoundsStore((state) => state.updateAsset)
  const { duplicate } = useCreateSound()
  const { requestDelete } = useDeleteSound()

  // A different sound cancels any rename in progress.
  useEffect(() => {
    setIsRenaming(false)
    setDraftName(asset.name)
  }, [asset.id, asset.name])

  // A different sound also clears a stale export error.
  useEffect(() => {
    setExportError(null)
  }, [asset.id])

  // Hand focus back to the pencil once the inline input goes away.
  useEffect(() => {
    if (wasRenamingRef.current && !isRenaming) renameButtonRef.current?.focus()
    wasRenamingRef.current = isRenaming
  }, [isRenaming])

  const handleStartRename = useCallback(() => {
    isCancellingRef.current = false
    setDraftName(asset.name)
    setIsRenaming(true)
  }, [asset.name])

  const commitRename = useCallback(() => {
    if (isCancellingRef.current) return
    const name = draftName.trim()
    if (name && name !== asset.name) {
      // Two sounds with one name would export to the same file — suffix it.
      const otherNames = assets.filter((item) => item.id !== asset.id).map((item) => item.name)
      updateAsset(asset.id, { name: buildUniqueName(name, otherNames) })
    }
    setIsRenaming(false)
  }, [draftName, assets, asset.id, asset.name, updateAsset])

  const handleDraftChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => setDraftName(event.target.value),
    []
  )

  const handleRenameKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        commitRename()
      } else if (event.key === 'Escape') {
        event.preventDefault()
        isCancellingRef.current = true
        setDraftName(asset.name)
        setIsRenaming(false)
      }
    },
    [commitRename, asset.name]
  )

  const handleRenameFocus = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => event.currentTarget.select(),
    []
  )

  const handleDuplicate = useCallback(() => {
    duplicate(asset)
  }, [duplicate, asset])

  const handleExport = useCallback(async () => {
    setIsExporting(true)
    setExportError(null)
    try {
      const buffer = await audioBufferCache.load(asset)
      if (!buffer) {
        setExportError(SOUND_LIBRARY_ERRORS.EXPORT_FAILED)
        return
      }
      downloadBlob(encodeWav(buffer), `${asset.name}${WAV_EXTENSION}`)
    } catch (error) {
      console.error('Failed to export WAV:', error)
      setExportError(SOUND_LIBRARY_ERRORS.EXPORT_FAILED)
    } finally {
      setIsExporting(false)
    }
  }, [asset])

  const handleDelete = useCallback(() => requestDelete(asset.id), [requestDelete, asset.id])

  return {
    renameButtonRef,
    isRenaming,
    draftName,
    isExporting,
    exportError,
    nameMaxLength: SOUND_NAME_MAX_LENGTH,
    nameParts: splitNameForTruncation(asset.name, NAME_VISIBLE_TAIL_LENGTH),
    kindLabel: getAssetKindLabel(asset),
    meta: buildMeta(asset, source),
    isAI: source === 'ai',
    handleStartRename,
    handleDraftChange,
    handleRenameKeyDown,
    handleRenameFocus,
    handleRenameBlur: commitRename,
    handleDuplicate,
    handleExport,
    handleDelete,
  }
}
