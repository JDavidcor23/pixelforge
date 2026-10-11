import { useCallback, useEffect, useRef, useState } from 'react'

import { useSoundsStore } from '@/stores/sounds.store'
import { TRACK_COLOR, TRACK_KIND_OPTIONS } from '@/constants/track-colors'
import type { AudioAssetTag } from '@/types/audio'

export function useAddTrackRow() {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const addTrack = useSoundsStore((state) => state.addTrack)

  const closeMenu = useCallback((returnFocus: boolean) => {
    setIsMenuOpen(false)
    if (returnFocus) triggerRef.current?.focus()
  }, [])

  // Focus the first item on open; close on outside press.
  useEffect(() => {
    if (!isMenuOpen) return
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return
      closeMenu(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isMenuOpen, closeMenu])

  const handleToggleMenu = useCallback(() => setIsMenuOpen((open) => !open), [])

  const handleAddTrack = useCallback(
    (kind: AudioAssetTag) => {
      addTrack(kind)
      closeMenu(true)
    },
    [addTrack, closeMenu]
  )

  const handleMenuKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeMenu(true)
        return
      }
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
      event.preventDefault()
      const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])
      const current = items.findIndex((item) => item === document.activeElement)
      const delta = event.key === 'ArrowDown' ? 1 : -1
      items[(current + delta + items.length) % items.length]?.focus()
    },
    [closeMenu]
  )

  return {
    triggerRef,
    menuRef,
    isMenuOpen,
    options: TRACK_KIND_OPTIONS.map((option) => ({ ...option, iconClass: TRACK_COLOR[option.kind].ICON })),
    handleToggleMenu,
    handleAddTrack,
    handleMenuKeyDown,
  }
}
