import { useCallback, useEffect, useRef, useState } from 'react'

import { useSoundsStore } from '@/stores/sounds.store'
import { isTimeInsideClip } from '@/lib/timeline-ops'
import { TIMELINE_TIPS, TIP_NOTICE_DURATION_MS } from '@/constants/timeline-view'
import type { SoundsStore } from '@/stores/types/audio-slices'

/** The hint that fits what the user is looking at right now. */
function selectTip(state: SoundsStore): string {
  if (state.clips.length === 0) return TIMELINE_TIPS.EMPTY
  const selected = state.clips.find((clip) => clip.id === state.selectedClipId)
  if (!selected) return TIMELINE_TIPS.IDLE
  return isTimeInsideClip(selected, state.playheadTime)
    ? TIMELINE_TIPS.SELECTED_INSIDE
    : TIMELINE_TIPS.SELECTED_OUTSIDE
}

/**
 * A user edit (not undo/redo, not a library delete) that removed clips:
 * the history grew, nothing is redoable and every asset is still there.
 */
function isClipDeletion(state: SoundsStore, prev: SoundsStore): boolean {
  return (
    state.clips.length < prev.clips.length &&
    state.timelinePast !== prev.timelinePast &&
    state.timelineFuture.length === 0 &&
    state.assets.length === prev.assets.length
  )
}

/**
 * Contextual tip + the "Clip deleted · Undo" notice. Open state of the
 * shortcuts popover lives in the editor (the `?` shortcut opens it too);
 * this hook owns focus return.
 */
export function useTipBar(onCloseShortcuts: () => void) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [hasDeleteNotice, setHasDeleteNotice] = useState(false)

  const tip = useSoundsStore(selectTip)
  const undo = useSoundsStore((state) => state.undo)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const unsubscribe = useSoundsStore.subscribe((state, prev) => {
      if (state.clips === prev.clips) return
      clearTimeout(timer)
      const deleted = isClipDeletion(state, prev)
      setHasDeleteNotice(deleted)
      if (deleted) timer = setTimeout(() => setHasDeleteNotice(false), TIP_NOTICE_DURATION_MS)
    })
    return () => {
      clearTimeout(timer)
      unsubscribe()
    }
  }, [])

  const handleCloseShortcuts = useCallback(
    (returnFocus: boolean) => {
      onCloseShortcuts()
      if (returnFocus) triggerRef.current?.focus()
    },
    [onCloseShortcuts]
  )

  const handleUndoDelete = useCallback(() => {
    setHasDeleteNotice(false)
    undo()
  }, [undo])

  return {
    triggerRef,
    tip,
    hasDeleteNotice,
    noticeText: TIMELINE_TIPS.CLIP_DELETED,
    undoLabel: TIMELINE_TIPS.UNDO,
    handleCloseShortcuts,
    handleUndoDelete,
  }
}
