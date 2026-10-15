import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, MouseEvent } from 'react'

import { useFrameCount } from '@/sprites/hooks/useSpriteEditorStore.hook'
import { useSpriteEditorStore } from '@/stores'
import { useAIJobsStore } from '@/stores/ai-jobs.store'
import { useAssetsStore } from '@/stores/assets.store'
import { buildAssetReference, buildCanvasReference, canvasFrameReferenceLabel } from '../animation-reference'
import { buildAssetLibraryItems } from '@/lib/asset-library-items'
import { layersToBase64 } from '@/lib/export-utils'
import { DIALOG_FOCUS_TRAP_KEY, FILE_MENU_DISMISS_KEY } from '@/constants/file-menu'
import type { AssetLibraryItem } from '@/types'

export type ReferencePickerTab = 'canvas' | 'assets'

export interface CanvasFrameOption {
  readonly frameIndex: number
  readonly label: string
  readonly thumbnailSrc: string
}

export interface UseReferencePickerParams {
  readonly onClose: () => void
}

// Same manual Tab trap as `useImportSpriteSheetDialog.hook.ts` / `useDeleteAccountDialog.hook.ts`.
const FOCUSABLE_SELECTOR = 'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'

const getFocusable = (root: HTMLElement): HTMLElement[] =>
  Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => element.getClientRects().length > 0,
  )

/**
 * Reference picker (ADR 0011): two sources, Canvas (every timeline frame) and
 * Assets (the shared library). Picking either locks a SNAPSHOT into
 * `useAIJobsStore.animationReference` and closes the picker — modal mechanics
 * (focus trap, Escape, backdrop) mirror `useImportSpriteSheetDialog.hook.ts`.
 */
export const useReferencePicker = ({ onClose }: UseReferencePickerParams) => {
  const [activeTab, setActiveTab] = useState<ReferencePickerTab>('canvas')
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  const frameCount = useFrameCount()
  const generations = useAssetsStore((s) => s.generations)
  const animations = useAssetsStore((s) => s.animations)
  const setAnimationReference = useAIJobsStore((s) => s.setAnimationReference)

  useEffect(() => {
    dialogRef.current?.focus()
  }, [])

  // Rasterized once per open (`frameCount` also covers a frame added/removed
  // while it's open) — reuses `layersToBase64`, the same path the Animate
  // tab already used for the live canvas, applied to EVERY timeline frame.
  const canvasFrames = useMemo<CanvasFrameOption[]>(() => {
    const { canvasWidth, canvasHeight, timeline } = useSpriteEditorStore.getState()
    return timeline.frames.map((frame, frameIndex) => ({
      frameIndex,
      label: canvasFrameReferenceLabel(frameIndex),
      thumbnailSrc: layersToBase64(canvasWidth, canvasHeight, frame.layers),
    }))
  }, [frameCount])

  // Same merge as `useAssetsPanel.hook.ts`'s Assets-tab view-model, shared via
  // `buildAssetLibraryItems` (the picker only needs id/label/thumbnail, not
  // that hook's folder/search/rename state built on top of it).
  const assetItems = useMemo<AssetLibraryItem[]>(
    () => buildAssetLibraryItems({ generations, animations }),
    [generations, animations],
  )

  const handlePickCanvasFrame = useCallback(
    (frame: CanvasFrameOption) => {
      setAnimationReference(buildCanvasReference(frame.frameIndex, frame.thumbnailSrc))
      onClose()
    },
    [setAnimationReference, onClose],
  )

  const handlePickAsset = useCallback(
    (item: AssetLibraryItem) => {
      if (!item.thumbnailSrc) return
      setAnimationReference(buildAssetReference(item, item.thumbnailSrc))
      onClose()
    },
    [setAnimationReference, onClose],
  )

  const handleBackdropClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) onClose()
    },
    [onClose],
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === FILE_MENU_DISMISS_KEY) {
        event.stopPropagation()
        onClose()
        return
      }
      if (event.key !== DIALOG_FOCUS_TRAP_KEY || !dialogRef.current) return

      const focusable = getFocusable(dialogRef.current)
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    },
    [onClose],
  )

  return {
    dialogRef,
    titleId,
    descriptionId,
    activeTab,
    setActiveTab,
    canvasFrames,
    assetItems,
    handlePickCanvasFrame,
    handlePickAsset,
    handleBackdropClick,
    handleKeyDown,
  }
}
