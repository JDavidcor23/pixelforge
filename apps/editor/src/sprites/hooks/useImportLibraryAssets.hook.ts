import { useCallback, useRef, useState } from 'react'
import type { ChangeEvent, RefObject } from 'react'

import { useAssetsStore } from '@/stores/assets.store'
import { readLibraryImageFile } from '@/lib/import-library-image'
import type { AssetType } from '@/types'

export interface UseImportLibraryAssetsParams {
  readonly assetType: AssetType
}

export interface UseImportLibraryAssetsReturn {
  readonly fileInputRef: RefObject<HTMLInputElement | null>
  readonly isImporting: boolean
  readonly importError: string | null
  readonly handleOpenImportPicker: () => void
  readonly handleImportFiles: (event: ChangeEvent<HTMLInputElement>) => Promise<void>
}

/**
 * Lets the user add PNGs from disk straight into the Assets library, as if
 * they had been AI-generated — same `addGeneration` entry point the Create
 * tab uses after a Retro Diffusion result, minus the request itself. Shared
 * by the Create tab's Recent strip and the bottom panel's Assets library view
 * (`AssetGrid`), so both stay on one import path.
 */
export const useImportLibraryAssets = ({ assetType }: UseImportLibraryAssetsParams): UseImportLibraryAssetsReturn => {
  const addGeneration = useAssetsStore((s) => s.addGeneration)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  const handleOpenImportPicker = useCallback(() => fileInputRef.current?.click(), [])

  const handleImportFiles = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const input = event.target
      const files = input.files ? Array.from(input.files) : []
      if (files.length === 0) return

      try {
        setIsImporting(true)
        setImportError(null)
        // Sequential, not Promise.all: each `addGeneration` prepends onto the
        // CURRENT store state, so processing in order keeps the last-picked
        // file on top — "newest first" the same way a real generation would.
        for (const file of files) {
          const { name, dataUrl, width, height } = await readLibraryImageFile(file)
          addGeneration({ prompt: name, base64: dataUrl, width, height, assetType })
        }
      } catch (e) {
        setImportError(e instanceof Error ? e.message : 'Could not import the image.')
      } finally {
        setIsImporting(false)
        // Reset so picking the same file again re-triggers the change event.
        input.value = ''
      }
    },
    [addGeneration, assetType],
  )

  return { fileInputRef, isImporting, importError, handleOpenImportPicker, handleImportFiles }
}
