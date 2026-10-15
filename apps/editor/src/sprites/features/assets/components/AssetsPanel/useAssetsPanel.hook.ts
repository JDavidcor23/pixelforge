import { useCallback, useMemo, useState } from 'react'

import { buildAssetLibraryItems } from '@/lib/asset-library-items'
import { composeHorizontalSheet } from '@/lib/compose-horizontal-sheet'
import { downloadFromHref, downloadJson } from '@/lib/download-file'
import { useApplyAsset } from '@/sprites/hooks/useApplyAsset.hook'
import { useImportLibraryAssets } from '@/sprites/hooks/useImportLibraryAssets.hook'
import { useRequestFocusPrompt, useSetInspectorTab } from '@/sprites/hooks/useSpriteEditorStore.hook'
import { useAssetsStore } from '@/stores/assets.store'
import { ASSET_FOLDERS, DEFAULT_ASSET_TYPE } from '@/constants'
import type { AssetLibraryItem, AssetType } from '@/types'

type FolderId = 'all' | AssetType

export interface UseAssetsPanelParams {
  /** Owned by the bottom panel's tab bar (search box only renders there). */
  readonly search: string
}

export const useAssetsPanel = ({ search }: UseAssetsPanelParams) => {
  const generations = useAssetsStore((s) => s.generations)
  const animations = useAssetsStore((s) => s.animations)
  const removeGeneration = useAssetsStore((s) => s.removeGeneration)
  const removeAnimation = useAssetsStore((s) => s.removeAnimation)
  const renameItem = useAssetsStore((s) => s.renameItem)
  const setItemAssetType = useAssetsStore((s) => s.setItemAssetType)
  const { applyGeneration, applyAnimation } = useApplyAsset()
  const setInspectorTab = useSetInspectorTab()
  const requestFocusPrompt = useRequestFocusPrompt()

  const [selectedFolderId, setSelectedFolderId] = useState<FolderId>('all')
  const [isApplying, setIsApplying] = useState(false)

  const selectedFolder = ASSET_FOLDERS.find((folder) => folder.id === selectedFolderId) ?? ASSET_FOLDERS[0]

  const {
    fileInputRef: importFileInputRef,
    isImporting,
    importError,
    handleOpenImportPicker,
    handleImportFiles,
  } = useImportLibraryAssets({ assetType: selectedFolder.assetType ?? DEFAULT_ASSET_TYPE })

  const items = useMemo<AssetLibraryItem[]>(
    () => buildAssetLibraryItems({ generations, animations }),
    [generations, animations],
  )

  const folderCounts = useMemo(() => {
    const counts: Partial<Record<FolderId, number>> = {}
    for (const folder of ASSET_FOLDERS) {
      counts[folder.id] =
        folder.assetType === null
          ? items.length
          : items.filter((item) => item.assetType === folder.assetType).length
    }
    return counts
  }, [items])

  const normalizedSearch = search.trim().toLowerCase()

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        if (selectedFolder.assetType !== null && item.assetType !== selectedFolder.assetType) return false
        if (normalizedSearch && !item.label.toLowerCase().includes(normalizedSearch)) return false
        return true
      }),
    [items, selectedFolder, normalizedSearch],
  )

  const handleSelectFolder = useCallback((folderId: FolderId) => setSelectedFolderId(folderId), [])
  // "Open Create" / "New asset": land on Create > Generate (not whatever
  // method was last active) and ask the Generate panel to focus its prompt.
  const handleOpenCreate = useCallback(() => {
    setInspectorTab('create')
    requestFocusPrompt()
  }, [setInspectorTab, requestFocusPrompt])

  const handleSelectItem = useCallback(
    async (item: AssetLibraryItem) => {
      try {
        setIsApplying(true)
        // 'drawing' items live in the same `generations` slice as 'generation'
        // ones (ADR 0010, Phase 1) — only 'animation' needs the other branch.
        if (item.kind !== 'animation') {
          const generation = generations.find((gen) => gen.id === item.id)
          if (!generation) return
          await applyGeneration({ base64: generation.base64, width: generation.width })
        } else {
          const animation = animations.find((anim) => anim.id === item.id)
          if (!animation) return
          await applyAnimation({ frames: animation.frames, frameDurationMs: animation.frameDurationMs })
        }
      } finally {
        setIsApplying(false)
      }
    },
    [generations, animations, applyGeneration, applyAnimation],
  )

  const handleDownloadItem = useCallback(
    (item: AssetLibraryItem) => {
      if (item.kind !== 'animation') {
        const generation = generations.find((gen) => gen.id === item.id)
        if (!generation) return
        downloadFromHref(
          generation.base64,
          `sprite-${generation.prompt.replace(/\s+/g, '-').toLowerCase()}-${generation.timestamp}.png`,
        )
        return
      }

      const animation = animations.find((anim) => anim.id === item.id)
      if (!animation) return
      composeHorizontalSheet(animation.frames)
        .then((sheet) => {
          if (!sheet) return
          downloadFromHref(
            sheet,
            `animation-${animation.label.replace(/\s+/g, '-').toLowerCase()}-${animation.timestamp}.png`,
          )
        })
        .catch((e: unknown) => console.error('Failed to compose animation sheet for download', e))
    },
    [generations, animations],
  )

  const handleDownloadSource = useCallback(
    (item: AssetLibraryItem) => {
      if (item.kind === 'animation') return
      const generation = generations.find((gen) => gen.id === item.id)
      if (!generation) return
      downloadJson(
        {
          prompt: generation.prompt,
          width: generation.width,
          height: generation.height,
          timestamp: new Date(generation.timestamp).toISOString(),
          base64: generation.base64,
        },
        `sprite-${generation.id}-source.json`,
      )
    },
    [generations],
  )

  const handleDeleteItem = useCallback(
    (item: AssetLibraryItem) => {
      if (item.kind === 'animation') removeAnimation(item.id)
      else removeGeneration(item.id)
    },
    [removeGeneration, removeAnimation],
  )

  // ADR 0010, Phase 2 — rename / "move to" icon buttons on AssetTile. `renameItem`
  // and `setItemAssetType` already route by `item.kind` internally, same as how
  // `item.kind` picks `removeGeneration` vs `removeAnimation` above.
  const handleRenameItem = useCallback(
    (item: AssetLibraryItem, label: string) => renameItem(item.id, item.kind, label),
    [renameItem],
  )

  const handleMoveItem = useCallback(
    (item: AssetLibraryItem, assetType: AssetType) => setItemAssetType(item.id, item.kind, assetType),
    [setItemAssetType],
  )

  return {
    folders: ASSET_FOLDERS,
    selectedFolderId,
    folderCounts,
    handleSelectFolder,
    filteredItems,
    selectedFolderLabel: selectedFolder.label,
    isApplying,
    handleSelectItem,
    handleDownloadItem,
    handleDownloadSource,
    handleDeleteItem,
    handleRenameItem,
    handleMoveItem,
    handleOpenCreate,
    importFileInputRef,
    isImporting,
    importError,
    handleOpenImportPicker,
    handleImportFiles,
  }
}
