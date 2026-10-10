import { useCallback, useEffect, useId, useRef } from 'react'

import { useSoundsStore } from '@/stores/sounds.store'
import { NEW_SOUND_AUTOFOCUS } from '@/constants/sound-library'

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'

const autofocusSelector = (value: string): string => `[data-autofocus="${value}"]`

function getFocusable(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => element.getClientRects().length > 0
  )
}

export function useNewSoundPopover(triggerRef: React.RefObject<HTMLButtonElement | null>) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  const section = useSoundsStore((state) => state.newSoundSection)
  const openCount = useSoundsStore((state) => state.newSoundOpenCount)
  const closeNewSound = useSoundsStore((state) => state.closeNewSound)

  const handleClose = useCallback(() => {
    closeNewSound()
    triggerRef.current?.focus()
  }, [closeNewSound, triggerRef])

  // Focus the first item of the requested section on every open.
  useEffect(() => {
    dialogRef.current?.querySelector<HTMLElement>(autofocusSelector(NEW_SOUND_AUTOFOCUS[section]))?.focus()
  }, [openCount, section])

  // Outside click closes. The trigger is excluded: it toggles on its own.
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return
      if (dialogRef.current?.contains(event.target)) return
      if (triggerRef.current?.contains(event.target)) return
      closeNewSound()
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [closeNewSound, triggerRef])

  // When the popover goes away with focus left nowhere, hand it back to the trigger.
  useEffect(() => {
    const trigger = triggerRef.current
    return () => {
      if (!document.activeElement || document.activeElement === document.body) {
        trigger?.focus()
      }
    }
  }, [triggerRef])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        handleClose()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return

      // Focus trap: wrap Tab / Shift+Tab inside the dialog.
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
    [handleClose]
  )

  return { dialogRef, titleId, handleClose, handleKeyDown }
}
