import { useDeleteSoundDialog } from './useDeleteSoundDialog.hook'
import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'

export function DeleteSoundDialog() {
  const {
    isOpen,
    assetName,
    nameParts,
    clipUsage,
    cancelRef,
    confirmRef,
    titleId,
    descriptionId,
    handleCancel,
    handleConfirm,
    handleBackdropClick,
    handleKeyDown,
  } = useDeleteSoundDialog()

  if (!isOpen) return null

  return (
    <div
      onClick={handleBackdropClick}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-sunken/70 backdrop-blur-sm ${MOTION.FADE_ENTER}`}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={`w-full max-w-sm rounded-md border border-line-strong bg-raised p-5 shadow-popover outline-none ${MOTION.ENTER}`}
      >
        <h2 id={titleId} title={assetName} className="flex min-w-0 text-sm font-semibold text-ink">
          <span className="shrink-0 whitespace-pre">Delete “</span>
          <span className="truncate">{nameParts.head}</span>
          <span className="shrink-0">{nameParts.tail}”?</span>
        </h2>
        <p id={descriptionId} className="mt-2 text-xs text-muted">
          This removes the sound from your library. This can’t be undone.
          {clipUsage && <span className="mt-1 block">{clipUsage}</span>}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={handleCancel}
            className={`rounded-sm border border-line-strong px-3 py-1.5 text-ui text-ink hover:bg-hover ${MOTION.PRESS} ${FOCUS_RING.RAISED}`}
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={handleConfirm}
            className={`rounded-sm bg-danger px-3 py-1.5 text-ui font-semibold text-ink hover:bg-danger/85 ${MOTION.PRESS} ${FOCUS_RING.RAISED}`}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
