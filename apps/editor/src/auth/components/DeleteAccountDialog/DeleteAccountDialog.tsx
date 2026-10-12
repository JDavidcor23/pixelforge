import { Loader2 } from 'lucide-react'

import { ModalPortal } from '@/components/ModalPortal/ModalPortal'
import { useDeleteAccountDialog } from './useDeleteAccountDialog.hook'
import { DELETE_ACCOUNT_CONFIRM_WORD, DELETE_ACCOUNT_COPY } from '@/constants/account-deletion'
import { DISABLED_STATE, FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'
import { Z_INDEX } from '@/constants/z-index'

interface DeleteAccountDialogProps {
  onClose: () => void
}

const INPUT = `w-full rounded border border-line-strong bg-sunken px-3 py-2 text-sm text-ink placeholder:text-subtle ${FOCUS_RING.INPUT} ${DISABLED_STATE}`
const CHECKBOX = `mt-0.5 size-3.5 shrink-0 rounded border-line-strong text-accent ${FOCUS_RING.INPUT} ${DISABLED_STATE}`
const CANCEL_BUTTON = `rounded-sm border border-line-strong px-3 py-1.5 text-ui text-ink hover:bg-hover ${MOTION.PRESS} ${FOCUS_RING.RAISED} ${DISABLED_STATE}`
const CONFIRM_BUTTON = `flex items-center gap-1.5 rounded-sm bg-danger px-3 py-1.5 text-ui font-semibold text-ink hover:bg-danger/85 ${MOTION.PRESS} ${FOCUS_RING.RAISED} ${DISABLED_STATE}`

export function DeleteAccountDialog({ onClose }: DeleteAccountDialogProps) {
  const {
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
  } = useDeleteAccountDialog({ onClose })

  return (
    <ModalPortal>
      <div
        onClick={handleBackdropClick}
        className={`fixed inset-0 ${Z_INDEX.MODAL} flex items-center justify-center bg-sunken/70 backdrop-blur-sm ${MOTION.FADE_ENTER}`}
      >
        <div
          ref={dialogRef}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          className={`w-full max-w-sm rounded-md border border-line-strong bg-raised p-5 shadow-popover outline-none ${MOTION.ENTER}`}
        >
          <h2 id={titleId} className="text-sm font-semibold text-ink">
            {DELETE_ACCOUNT_COPY.TITLE}
          </h2>
          <p id={descriptionId} className="mt-2 text-xs leading-relaxed text-muted">
            {DELETE_ACCOUNT_COPY.BODY}
          </p>

          <label className="mt-4 flex items-start gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={clearLocalData}
              onChange={handleToggleClearLocalData}
              disabled={isDeleting}
              className={CHECKBOX}
            />
            <span>{DELETE_ACCOUNT_COPY.LOCAL_CHECKBOX_LABEL}</span>
          </label>

          <div className="mt-4">
            <label htmlFor="delete-account-confirm" className="mb-1.5 block text-xs font-medium text-muted">
              {DELETE_ACCOUNT_COPY.CONFIRM_INPUT_LABEL}
            </label>
            <input
              id="delete-account-confirm"
              name="delete-account-confirm"
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={confirmText}
              onChange={handleConfirmTextChange}
              disabled={isDeleting}
              placeholder={DELETE_ACCOUNT_CONFIRM_WORD}
              className={INPUT}
            />
          </div>

          {errorMessage && (
            <p ref={errorRef} role="alert" tabIndex={-1} className="mt-3 text-xs text-danger outline-none">
              {errorMessage}
            </p>
          )}

          <div className="mt-5 flex justify-end gap-2">
            <button ref={cancelRef} type="button" onClick={handleCancel} disabled={isDeleting} className={CANCEL_BUTTON}>
              {DELETE_ACCOUNT_COPY.CANCEL_BUTTON}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={!isConfirmed || isDeleting}
              className={CONFIRM_BUTTON}
            >
              {isDeleting && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
              {isDeleting ? DELETE_ACCOUNT_COPY.CONFIRM_BUTTON_PENDING : DELETE_ACCOUNT_COPY.CONFIRM_BUTTON}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  )
}
