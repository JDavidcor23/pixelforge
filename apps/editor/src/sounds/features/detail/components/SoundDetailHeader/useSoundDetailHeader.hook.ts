import { useCallback, useEffect, useRef, useState } from 'react'

import { useSoundsStore } from '@/stores/sounds.store'
import { useCreateSound } from '@/sounds/hooks/useCreateSound.hook'
import { audioBufferCache } from '@/lib/audio-buffer-cache'
import { encodeWav } from '@/lib/audio-encoder'
import { downloadBlob } from '@/lib/export-utils'
import {
  buildUniqueName,
  formatDuration,
  getAssetKindLabel,
  releaseObjectUrl,
  splitNameForTruncation,
} from '@/lib/sound-assets'
import {
  DELETE_CONFIRM_TIMEOUT_MS,
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
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

  const assets = useSoundsStore((state) => state.assets)
  const updateAsset = useSoundsStore((state) => state.updateAsset)
  const removeAsset = useSoundsStore((state) => state.removeAsset)
  const setSelectedAsset = useSoundsStore((state) => state.setSelectedAsset)
  const { duplicate } = useCreateSound()

  // A different sound cancels any rename in progress.
  useEffect(() => {
    setIsRenaming(false)
    setDraftName(asset.name)
  }, [asset.id, asset.name])

  // A different sound also disarms delete and clears a stale export error.
  useEffect(() => {
    setIsConfirmingDelete(false)
    setExportError(null)
  }, [asset.id])

  // An armed delete disarms itself if the user walks away.
  useEffect(() => {
    if (!isConfirmingDelete) return
    const timer = window.setTimeout(() => setIsConfirmingDelete(false), DELETE_CONFIRM_TIMEOUT_MS)
    return () => window.clearTimeout(timer)
  }, [isConfirmingDelete])

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

  const handleDelete = useCallback(() => {
    // First click arms; only a second click while armed deletes.
    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true)
      return
    }
    const index = assets.findIndex((item) => item.id === asset.id)
    const neighbor = assets[index + 1] ?? assets[index - 1] ?? null
    removeAsset(asset.id)
    audioBufferCache.delete(asset.id)
    releaseObjectUrl(asset.localObjectUrl, useSoundsStore.getState().assets)
    setSelectedAsset(neighbor?.id ?? null)
  }, [isConfirmingDelete, assets, asset.id, asset.localObjectUrl, removeAsset, setSelectedAsset])

  const handleDeleteBlur = useCallback(() => setIsConfirmingDelete(false), [])

  return {
    renameButtonRef,
    isRenaming,
    draftName,
    isExporting,
    exportError,
    isConfirmingDelete,
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
    handleDeleteBlur,
  }
}
