import { X } from 'lucide-react'

import { useImportErrorNotice } from './useImportErrorNotice.hook'
import { IMPORT_FILE_ERROR_NOTICE_COPY } from '@/constants/file-menu'
import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'
import { Z_INDEX } from '@/constants/z-index'
import type { ImportErrorNoticeProps } from '@/types'

/** Bottom notice for a File > Import sprite sheet… pick that could not be read or decoded. */
export const ImportErrorNotice = ({ message, onDismiss }: ImportErrorNoticeProps) => {
  useImportErrorNotice(message, onDismiss)

  return (
    <div
      role="alert"
      className={`fixed inset-x-0 bottom-4 ${Z_INDEX.POPOVER} mx-auto flex w-fit items-center gap-3 rounded-md border border-line-strong bg-raised px-4 py-2.5 shadow-popover ${MOTION.ENTER}`}
    >
      <p className="text-xs text-danger">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label={IMPORT_FILE_ERROR_NOTICE_COPY.DISMISS_LABEL}
        className={`rounded-sm p-0.5 text-subtle hover:bg-hover hover:text-ink ${MOTION.COLORS} ${FOCUS_RING.RAISED}`}
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </div>
  )
}
