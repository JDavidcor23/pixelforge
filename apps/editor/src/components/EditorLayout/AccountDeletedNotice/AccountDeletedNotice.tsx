import { X } from 'lucide-react'

import { useAccountDeletedNotice } from './useAccountDeletedNotice.hook'
import { DELETE_ACCOUNT_COPY } from '@/constants/account-deletion'
import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'
import { Z_INDEX } from '@/constants/z-index'

export function AccountDeletedNotice() {
  const { handleDismiss } = useAccountDeletedNotice()

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-x-0 bottom-4 ${Z_INDEX.POPOVER} mx-auto flex w-fit items-center gap-3 rounded-md border border-line-strong bg-raised px-4 py-2.5 shadow-popover ${MOTION.ENTER}`}
    >
      <p className="text-xs text-ink">{DELETE_ACCOUNT_COPY.SUCCESS_MESSAGE}</p>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss"
        className={`rounded-sm p-0.5 text-subtle hover:bg-hover hover:text-ink ${MOTION.COLORS} ${FOCUS_RING.RAISED}`}
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </div>
  )
}
