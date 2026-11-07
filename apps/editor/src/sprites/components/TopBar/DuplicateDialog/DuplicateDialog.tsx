import { ModalPortal } from '@/components/ModalPortal/ModalPortal'
import { AssetTypeSelector } from '@/sprites/features/properties/components/CreateTab/AssetTypeSelector'
import { useDuplicateDialog } from './useDuplicateDialog.hook'
import { DUPLICATE_COPY, DUPLICATE_FIELD_IDS } from '@/constants/file-menu'
import { DISABLED_STATE, FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'
import { Z_INDEX } from '@/constants/z-index'
import type { DuplicateDialogProps } from '@/types'

const LABEL = 'mb-1.5 block text-xs font-medium text-muted'
const INPUT = `w-full rounded border border-line-strong bg-sunken px-3 py-2 text-sm text-ink placeholder:text-subtle ${FOCUS_RING.INPUT} ${DISABLED_STATE}`
const CANCEL_BUTTON = `rounded-sm border border-line-strong px-3 py-1.5 text-ui text-ink hover:bg-hover ${MOTION.PRESS} ${FOCUS_RING.RAISED} ${DISABLED_STATE}`
const CONFIRM_BUTTON = `flex items-center gap-1.5 rounded-sm bg-accent px-3 py-1.5 text-ui font-semibold text-on-accent hover:bg-accent-strong ${MOTION.PRESS} ${FOCUS_RING.RAISED} ${DISABLED_STATE}`

export const DuplicateDialog = ({
  name,
  assetType,
  errorMessage,
  canDuplicate,
  onNameChange,
  onAssetTypeChange,
  onCancel,
  onConfirm,
}: DuplicateDialogProps) => {
  const { dialogRef, nameInputRef, titleId, descriptionId, handleBackdropClick, handleKeyDown, handleSubmit } =
    useDuplicateDialog({ onCancel, onConfirm })

  return (
    <ModalPortal>
      <div
        onClick={handleBackdropClick}
        className={`fixed inset-0 ${Z_INDEX.MODAL} flex items-center justify-center bg-sunken/70 backdrop-blur-sm ${MOTION.FADE_ENTER}`}
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          className={`w-full max-w-sm rounded-md border border-line-strong bg-raised p-5 shadow-popover outline-none ${MOTION.ENTER}`}
        >
          <form onSubmit={handleSubmit} noValidate>
            <h2 id={titleId} className="text-sm font-semibold text-ink">
              {DUPLICATE_COPY.TITLE}
            </h2>
            <p id={descriptionId} className="mt-2 text-xs leading-relaxed text-muted">
              {DUPLICATE_COPY.DESCRIPTION}
            </p>

            <div className="mt-4">
              <label htmlFor={DUPLICATE_FIELD_IDS.NAME} className={LABEL}>
                {DUPLICATE_COPY.NAME_LABEL}
              </label>
              <input
                ref={nameInputRef}
                id={DUPLICATE_FIELD_IDS.NAME}
                name={DUPLICATE_FIELD_IDS.NAME}
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={name}
                onChange={onNameChange}
                className={INPUT}
              />
            </div>

            <div className="mt-4">
              <span className={LABEL}>{DUPLICATE_COPY.TYPE_LABEL}</span>
              <AssetTypeSelector value={assetType} onChange={onAssetTypeChange} compact />
            </div>

            {errorMessage && (
              <p role="alert" className="mt-3 text-xs text-danger">
                {errorMessage}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={onCancel} className={CANCEL_BUTTON}>
                {DUPLICATE_COPY.CANCEL_BUTTON}
              </button>
              <button type="submit" disabled={!canDuplicate} className={CONFIRM_BUTTON}>
                {DUPLICATE_COPY.CONFIRM_BUTTON}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  )
}
