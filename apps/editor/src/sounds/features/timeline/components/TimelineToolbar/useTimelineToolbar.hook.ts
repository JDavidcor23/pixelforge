import { useCallback } from 'react'

import { useSoundsStore } from '@/stores/sounds.store'
import { isTimeInsideClip } from '@/lib/timeline-ops'

export function useTimelineToolbar() {
  const snapEnabled = useSoundsStore((state) => state.snapEnabled)
  const selectedClipId = useSoundsStore((state) => state.selectedClipId)
  // Split is a command (split at playhead), so it is enabled whenever a cut would happen.
  const canSplit = useSoundsStore((state) => {
    const clip = state.clips.find((item) => item.id === state.selectedClipId)
    return clip ? isTimeInsideClip(clip, state.playheadTime) : false
  })
  const toggleSnap = useSoundsStore((state) => state.toggleSnap)
  const splitAtPlayhead = useSoundsStore((state) => state.splitAtPlayhead)
  const duplicate = useSoundsStore((state) => state.duplicate)
  const deleteClip = useSoundsStore((state) => state.deleteClip)

  const handleDuplicate = useCallback(() => {
    if (selectedClipId) duplicate(selectedClipId)
  }, [selectedClipId, duplicate])

  const handleDelete = useCallback(() => {
    if (selectedClipId) deleteClip(selectedClipId)
  }, [selectedClipId, deleteClip])

  return {
    snapEnabled,
    canSplit,
    hasSelection: selectedClipId !== null,
    handleSplit: splitAtPlayhead,
    handleDuplicate,
    handleDelete,
    handleToggleSnap: toggleSnap,
  }
}
