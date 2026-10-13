import { useCallback, useEffect, useId, useRef } from 'react'
import type { FormEvent, KeyboardEvent, MouseEvent } from 'react'

import { DIALOG_FOCUS_TRAP_KEY, FILE_MENU_DISMISS_KEY } from '@/constants/file-menu'
import type { UseImportSpriteSheetDialogParams, UseImportSpriteSheetDialogReturn } from '@/types'

// Same manual Tab trap as `useDeleteAccountDialog.hook.ts`.
const FOCUSABLE_SELECTOR = 'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'

const getFocusable = (root: HTMLElement): HTMLElement[] =>
  Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => element.getClientRects().length > 0,
  )

/** Modal mechanics only (focus, Escape, backdrop, submit); the import state lives in `useImportSpriteSheet`. */
export const useImportSpriteSheetDialog = ({
  onCancel,
  onConfirm,
}: UseImportSpriteSheetDialogParams): UseImportSpriteSheetDialogReturn => {
  const dialogRef = useRef<HTMLDivElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  // Land on Name with the file name selected, so typing replaces it.
  useEffect(() => {
    nameInputRef.current?.focus()
    nameInputRef.current?.select()
  }, [])

  const handleBackdropClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) onCancel()
    },
    [onCancel],
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === FILE_MENU_DISMISS_KEY) {
        event.stopPropagation()
        onCancel()
        return
      }
      if (event.key !== DIALOG_FOCUS_TRAP_KEY || !dialogRef.current) return

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
    [onCancel],
  )

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      onConfirm()
    },
    [onConfirm],
  )

  return { dialogRef, nameInputRef, titleId, descriptionId, handleBackdropClick, handleKeyDown, handleSubmit }
}
