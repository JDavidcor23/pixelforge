import { useEffect } from 'react'

import { useSoundsStore } from '@/stores/sounds.store'
import { clipEnd } from '@/lib/timeline-ops'
import { resolveTimelineShortcut } from '@/lib/timeline-shortcuts'
import { SNAP_GRID_SECONDS } from '@/constants/timeline'
import type { TimelineShortcutAction, TimelineShortcutHandlers } from '@/types/timeline-view'

/** Regions that own their keys: dialogs, popovers, menus and the library list. */
const KEY_OWNER_SELECTOR = '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]'
/** Elements where Space already means "activate". */
const ACTIVATABLE_SELECTOR =
  'button, a, select, summary, [role="button"], [role="slider"], [role="option"], [role="menuitem"]'
/** Clips are focusable `role="button"` divs with no native Space action. */
const CLIP_SELECTOR = '[data-timeline-clip]'
/** Elements where arrows already mean "change value". */
const VALUE_CONTROL_SELECTOR = 'input[type="range"], [role="slider"]'

const NUDGE_ACTIONS: readonly TimelineShortcutAction[] = [
  'nudge-left',
  'nudge-right',
  'trim-end-left',
  'trim-end-right',
  'trim-start-left',
  'trim-start-right',
]

function isTextEntry(target: Element): boolean {
  return (
    (target instanceof HTMLInputElement && target.type !== 'range') ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  )
}

function shouldIgnore(target: EventTarget | null, action: TimelineShortcutAction): boolean {
  if (!(target instanceof Element)) return false
  if (isTextEntry(target) || target.closest(KEY_OWNER_SELECTOR)) return true
  if (action === 'toggle-play') {
    return target.closest(ACTIVATABLE_SELECTOR) !== null && target.closest(CLIP_SELECTOR) === null
  }
  return NUDGE_ACTIONS.includes(action) && target.closest(VALUE_CONTROL_SELECTOR) !== null
}

/** Runs an action against the live store. Returns false when it did nothing. */
function runAction(action: TimelineShortcutAction, handlers: TimelineShortcutHandlers): boolean {
  const state = useSoundsStore.getState()
  const selected = state.clips.find((clip) => clip.id === state.selectedClipId) ?? null

  switch (action) {
    case 'split':
      state.splitAtPlayhead()
      return true
    case 'duplicate':
      if (selected) state.duplicate(selected.id)
      return selected !== null
    case 'delete':
      if (selected) state.deleteClip(selected.id)
      return selected !== null
    case 'toggle-snap':
      state.toggleSnap()
      return true
    case 'toggle-play':
      handlers.onTogglePlay()
      return true
    case 'show-shortcuts':
      handlers.onShowShortcuts()
      return true
    case 'undo':
      state.undo()
      return true
    case 'redo':
      state.redo()
      return true
    case 'zoom-in':
      state.zoomIn()
      return true
    case 'zoom-out':
      state.zoomOut()
      return true
    case 'escape':
      // A drag in progress cancels itself (useTimelineClip owns that Escape).
      if (state.timelineGestureSnapshot || !selected) return false
      state.selectClip(null)
      return true
    case 'nudge-left':
    case 'nudge-right': {
      if (!selected) return false
      const direction = action === 'nudge-left' ? -1 : 1
      state.moveClip(selected.id, selected.start + direction * SNAP_GRID_SECONDS)
      return true
    }
    case 'trim-end-left':
    case 'trim-end-right': {
      if (!selected) return false
      const direction = action === 'trim-end-left' ? -1 : 1
      state.trimEnd(selected.id, clipEnd(selected) + direction * SNAP_GRID_SECONDS)
      return true
    }
    case 'trim-start-left':
    case 'trim-start-right': {
      if (!selected) return false
      const direction = action === 'trim-start-left' ? -1 : 1
      state.trimStart(selected.id, selected.start + direction * SNAP_GRID_SECONDS)
      return true
    }
  }
}

/**
 * Timeline keyboard shortcuts, active while the timeline view is mounted.
 * Typing, dialogs, menus and the library list keep their own keys.
 */
export function useTimelineShortcuts({ onTogglePlay, onShowShortcuts }: TimelineShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return
      const action = resolveTimelineShortcut(event)
      if (!action || shouldIgnore(event.target, action)) return
      if (runAction(action, { onTogglePlay, onShowShortcuts })) event.preventDefault()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onTogglePlay, onShowShortcuts])
}
