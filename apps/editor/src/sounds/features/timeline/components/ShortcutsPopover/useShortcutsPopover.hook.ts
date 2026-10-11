import { useCallback, useEffect, useId, useRef } from 'react'

import { useModKeyLabel } from '../../hooks/useModKeyLabel.hook'
import { resolveShortcutKeys } from '@/lib/timeline-shortcuts'
import { TIMELINE_SHORTCUTS } from '@/constants/timeline-view'

export function useShortcutsPopover(
  triggerRef: React.RefObject<HTMLButtonElement | null>,
  onClose: (returnFocus: boolean) => void
) {
  const popoverRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const { isMac } = useModKeyLabel()

  // Land on Close; an outside press closes without stealing focus back.
  useEffect(() => {
    closeRef.current?.focus()
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (popoverRef.current?.contains(target) || triggerRef.current?.contains(target)) return
      onClose(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [triggerRef, onClose])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onClose(true)
    },
    [onClose]
  )

  const handleClose = useCallback(() => onClose(true), [onClose])

  return {
    popoverRef,
    closeRef,
    titleId,
    rows: TIMELINE_SHORTCUTS.map((shortcut) => {
      const keys = resolveShortcutKeys(shortcut.keys, isMac)
      const alternatives = shortcut.alternatives ?? false
      return {
        label: shortcut.label,
        keys,
        alternatives,
        // What a screen reader hears instead of the decorative chips.
        spokenKeys: keys.join(alternatives ? ' or ' : ' + '),
      }
    }),
    handleKeyDown,
    handleClose,
  }
}
