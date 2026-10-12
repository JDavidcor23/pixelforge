import { useCallback, useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, MouseEvent } from 'react'

import { AI_QUALITY_SAMPLE_COPY_FEEDBACK_MS, AI_QUALITY_SAMPLE_PROMPT } from '@/constants'
import type { QualityTier, QualityTierConfig } from '@/types'

export interface UseQualitySamplePreviewParams {
  readonly tiers: readonly QualityTierConfig[]
  readonly onClose: () => void
}

/**
 * "Compare samples" dialog, now with two views in the same modal:
 * - comparison grid (default) — all three tiers side by side, clickable.
 * - zoom — one tier enlarged, with Prev/Next to cycle and a "copy prompt" action.
 *
 * Escape and the header button are context-sensitive: from the zoom view they
 * step back to the comparison grid; only from the comparison grid do they
 * close the whole dialog (`onClose`). Same dismissal contract as
 * `useDeleteAccountDialog.hook.ts` otherwise — Escape plus an explicit button,
 * backdrop click closes unconditionally.
 */
export const useQualitySamplePreview = ({ tiers, onClose }: UseQualitySamplePreviewParams) => {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const [zoomedTierId, setZoomedTierId] = useState<QualityTier | null>(null)
  const [isCopied, setIsCopied] = useState(false)
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Re-focus the header button on mount AND whenever the view switches
  // between comparison and zoom, so keyboard users always land somewhere sensible.
  useEffect(() => {
    closeButtonRef.current?.focus()
  }, [zoomedTierId])

  useEffect(
    () => () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
    },
    [],
  )

  const zoomedIndex = zoomedTierId ? tiers.findIndex((tier) => tier.id === zoomedTierId) : -1
  const zoomedTier = zoomedIndex >= 0 ? tiers[zoomedIndex] : null

  const handleZoomTier = useCallback((tierId: QualityTier) => setZoomedTierId(tierId), [])

  const handleExitZoom = useCallback(() => setZoomedTierId(null), [])

  const handleCycleZoom = useCallback(
    (direction: 1 | -1) => {
      if (zoomedIndex < 0 || tiers.length === 0) return
      const nextIndex = (zoomedIndex + direction + tiers.length) % tiers.length
      setZoomedTierId(tiers[nextIndex].id)
    },
    [zoomedIndex, tiers],
  )

  // The header button doubles as "back to comparison" while zoomed and
  // "close the dialog" from the comparison grid.
  const handleHeaderButtonClick = useCallback(() => {
    if (zoomedTierId) handleExitZoom()
    else onClose()
  }, [zoomedTierId, handleExitZoom, onClose])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        if (zoomedTierId) handleExitZoom()
        else onClose()
        return
      }
      if (!zoomedTierId) return
      if (event.key === 'ArrowRight') {
        event.stopPropagation()
        handleCycleZoom(1)
      } else if (event.key === 'ArrowLeft') {
        event.stopPropagation()
        handleCycleZoom(-1)
      }
    },
    [zoomedTierId, onClose, handleExitZoom, handleCycleZoom],
  )

  const handleBackdropClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) onClose()
    },
    [onClose],
  )

  const handleCopyPrompt = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(AI_QUALITY_SAMPLE_PROMPT)
      setIsCopied(true)
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
      copyTimeoutRef.current = setTimeout(() => setIsCopied(false), AI_QUALITY_SAMPLE_COPY_FEEDBACK_MS)
    } catch (e) {
      console.error('Failed to copy the sample prompt', e)
    }
  }, [])

  return {
    closeButtonRef,
    handleKeyDown,
    handleBackdropClick,
    zoomedTier,
    handleZoomTier,
    handleCycleZoom,
    handleHeaderButtonClick,
    isCopied,
    handleCopyPrompt,
  }
}
