import { useCallback, useMemo, useState } from 'react'

import { animationSheetCache } from '@/lib/animation-sheet-cache'
import { downloadFromHref, downloadJson } from '@/lib/download-file'
import { useApplyAsset } from '@/sprites/hooks/useApplyAsset.hook'
import {
  useRequestFocusPrompt,
  useSetCreateMethod,
  useSetInspectorTab,
} from '@/sprites/hooks/useSpriteEditorStore.hook'
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
  const sheetsAvailableForDownload = useAssetsStore((s) => s.sheetsAvailableForDownload)
  const { applyGeneration, applyAnimation } = useApplyAsset()
  const setInspectorTab = useSetInspectorTab()
  const setCreateMethod = useSetCreateMethod()
  const requestFocusPrompt = useRequestFocusPrompt()

  const [selectedFolderId, setSelectedFolderId] = useState<FolderId>('all')
  const [isApplying, setIsApplying] = useState(false)

  const items = useMemo<AssetLibraryItem[]>(() => {
    const combined = [
      ...generations.map((gen) => ({
        timestamp: gen.timestamp,
        item: {
          id: gen.id,
          kind: 'generation' as const,
          label: gen.prompt,
          thumbnailSrc: gen.base64,
          assetType: gen.assetType ?? DEFAULT_ASSET_TYPE,
          isAnimated: false,
          canDownloadSheet: false,
        },
      })),
      ...animations.map((anim) => ({
        timestamp: anim.timestamp,
        item: {
          id: anim.id,
          kind: 'animation' as const,
          label: anim.label,
          thumbnailSrc: anim.frames[0] ?? '',
          assetType: anim.assetType ?? DEFAULT_ASSET_TYPE,
          isAnimated: true,
          canDownloadSheet: sheetsAvailableForDownload.has(anim.id),
        },
      })),
    ]
    return combined.sort((a, b) => b.timestamp - a.timestamp).map((entry) => entry.item)
  }, [generations, animations, sheetsAvailableForDownload])

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

  const selectedFolder = ASSET_FOLDERS.find((folder) => folder.id === selectedFolderId) ?? ASSET_FOLDERS[0]
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
    setCreateMethod('generate')
    requestFocusPrompt()
  }, [setInspectorTab, setCreateMethod, requestFocusPrompt])

  const handleSelectItem = useCallback(
    async (item: AssetLibraryItem) => {
      try {
        setIsApplying(true)
        if (item.kind === 'generation') {
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
      if (item.kind === 'generation') {
        const generation = generations.find((gen) => gen.id === item.id)
        if (!generation) return
        downloadFromHref(
          generation.base64,
          `sprite-${generation.prompt.replace(/\s+/g, '-').toLowerCase()}-${generation.timestamp}.png`,
        )
        return
      }

      const sheet = animationSheetCache.get(item.id)
      if (!sheet) return
      const animation = animations.find((anim) => anim.id === item.id)
      downloadFromHref(
        sheet,
        `animation-${(animation?.label ?? item.label).replace(/\s+/g, '-').toLowerCase()}-${animation?.timestamp ?? Date.now()}.png`,
      )
    },
    [generations, animations],
  )

  const handleDownloadSource = useCallback(
    (item: AssetLibraryItem) => {
      if (item.kind !== 'generation') return
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
    handleOpenCreate,
  }
}
