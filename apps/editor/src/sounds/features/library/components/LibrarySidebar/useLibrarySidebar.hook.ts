import { useCallback, useRef } from 'react'

import { useSoundsStore } from '@/stores/sounds.store'

export function useLibrarySidebar() {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const isNewSoundOpen = useSoundsStore((state) => state.isNewSoundOpen)
  const openNewSound = useSoundsStore((state) => state.openNewSound)
  const closeNewSound = useSoundsStore((state) => state.closeNewSound)

  const handleToggleNewSound = useCallback(() => {
    if (isNewSoundOpen) {
      closeNewSound()
    } else {
      openNewSound({ section: 'presets' })
    }
  }, [isNewSoundOpen, openNewSound, closeNewSound])

  return { triggerRef, isNewSoundOpen, handleToggleNewSound }
}
