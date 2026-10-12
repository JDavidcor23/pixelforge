import { useCallback, useEffect, useRef, useState } from 'react'

import { useAuthStore } from '@/stores/auth.store'
import { useEditorUIStore } from '@/stores/ui.store'
import { authService } from '@/services/auth.service'

/** First letter of the display name, or of the email if there is no name — shown when there's no Google avatar. */
function getInitial(displayName: string | null, email: string | null): string {
  const source = displayName ?? email ?? '?'
  return source.charAt(0).toUpperCase()
}

/**
 * TopBar's account entry (editor-auth change) — same open/outside-click/
 * Escape-with-focus-return popover pattern as the Export menu
 * (`useTopBar.hook.ts`) and the canvas-size picker (`useCanvasSizePopover.hook.ts`).
 */
export const useAccountMenu = () => {
  const isAvailable = useAuthStore((state) => state.isAvailable)
  const status = useAuthStore((state) => state.status)
  const user = useAuthStore((state) => state.user)
  const clearSession = useAuthStore((state) => state.clearSession)
  const openDeleteAccountDialog = useEditorUIStore((state) => state.openDeleteAccountDialog)

  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const close = useCallback((returnFocus = false) => {
    setIsOpen(false)
    if (returnFocus) triggerRef.current?.focus()
  }, [])
  const toggle = useCallback(() => setIsOpen((open) => !open), [])

  const handleSignOut = useCallback(() => {
    close()
    authService.signOut().catch((error: unknown) => {
      console.error('Sign out failed', error)
    })
    // Optimistic: the TopBar should go back to "Sign in" immediately rather
    // than wait on the network round trip, and onAuthStateChange will confirm it anyway.
    clearSession()
  }, [close, clearSession])

  const handleDeleteAccountClick = useCallback(() => {
    close()
    openDeleteAccountDialog()
  }, [close, openDeleteAccountDialog])

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        close()
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close(true)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, close])

  return {
    isAvailable,
    status,
    user,
    initial: getInitial(user?.displayName ?? null, user?.email ?? null),
    isOpen,
    menuRef,
    triggerRef,
    toggle,
    handleSignOut,
    handleDeleteAccountClick,
  }
}
