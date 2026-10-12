import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { ChangeEvent, KeyboardEvent, MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuthStore } from '@/stores/auth.store'
import { useAssetsStore } from '@/stores/assets.store'
import { useEditorUIStore } from '@/stores/ui.store'
import { authService } from '@/services/auth.service'
import { resolveDocumentRepository } from '@/services/resolve-document-repository.service'
import { mapDeleteAccountError } from '@/lib/map-delete-account-error'
import { isDeleteAccountConfirmed } from '@/lib/delete-account-confirm'
import { LOCAL_DRAFT_DOCUMENT_ID } from '@/constants/persistence'
import { EDITOR_ROUTES } from '@/constants/routes'

// Same manual Tab trap as `useNewSoundPopover.hook.ts` — this dialog has more
// than two focusable stops (checkbox, confirm input, Cancel, Delete), so the
// DeleteSoundDialog's two-element toggle trap doesn't fit.
const FOCUSABLE_SELECTOR = 'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'

function getFocusable(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => element.getClientRects().length > 0
  )
}

interface UseDeleteAccountDialogProps {
  readonly onClose: () => void
}

/**
 * Self-service "Delete my account" confirmation (editor-auth change). Only
 * mounted while open (same contract as `useSettingsPanel`'s `SettingsPanel`),
 * so there is no internal `isOpen` to track.
 */
export function useDeleteAccountDialog({ onClose }: UseDeleteAccountDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  const [confirmText, setConfirmText] = useState('')
  const [clearLocalData, setClearLocalData] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const clearSession = useAuthStore((state) => state.clearSession)
  const clearLocalHistory = useAssetsStore((state) => state.clearLocalHistory)
  const showAccountDeletedNotice = useEditorUIStore((state) => state.showAccountDeletedNotice)
  const navigate = useNavigate()

  const isConfirmed = isDeleteAccountConfirmed(confirmText)

  // Land on Cancel — the safe default, same reasoning as DeleteSoundDialog.
  useEffect(() => {
    cancelRef.current?.focus()
  }, [])

  // Moves focus to the error banner as soon as it renders (same pattern as
  // useAuthForm.hook.ts / useResetPasswordPage.hook.ts).
  useEffect(() => {
    if (errorMessage) errorRef.current?.focus()
  }, [errorMessage])

  const handleCancel = useCallback(() => {
    if (isDeleting) return
    onClose()
  }, [isDeleting, onClose])

  const handleBackdropClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) handleCancel()
    },
    [handleCancel]
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        handleCancel()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return

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
    [handleCancel]
  )

  const handleConfirmTextChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setConfirmText(event.target.value)
  }, [])

  const handleToggleClearLocalData = useCallback(() => {
    setClearLocalData((value) => !value)
  }, [])

  const handleDelete = useCallback(async () => {
    if (!isConfirmed || isDeleting) return
    setIsDeleting(true)
    setErrorMessage(null)

    const result = await authService.deleteAccount()
    if (!result.ok) {
      setIsDeleting(false)
      setErrorMessage(mapDeleteAccountError(result.code))
      return
    }

    if (clearLocalData) {
      try {
        const { repository } = await resolveDocumentRepository()
        await repository.remove(LOCAL_DRAFT_DOCUMENT_ID)
      } catch (error) {
        console.error('Failed to clear the local draft after account deletion', error)
      }
      clearLocalHistory()
    }

    try {
      await authService.signOut()
    } catch (error) {
      console.error('Sign out after account deletion failed', error)
    }
    // Optimistic, same reasoning as useAccountMenu's handleSignOut — the
    // account is already gone server-side regardless of this call's outcome.
    clearSession()
    onClose()
    navigate(EDITOR_ROUTES.SPRITES)
    showAccountDeletedNotice()
  }, [
    isConfirmed,
    isDeleting,
    clearLocalData,
    clearLocalHistory,
    clearSession,
    onClose,
    navigate,
    showAccountDeletedNotice,
  ])

  return {
    dialogRef,
    cancelRef,
    errorRef,
    titleId,
    descriptionId,
    confirmText,
    clearLocalData,
    isDeleting,
    isConfirmed,
    errorMessage,
    handleCancel,
    handleBackdropClick,
    handleKeyDown,
    handleConfirmTextChange,
    handleToggleClearLocalData,
    handleDelete,
  }
}
