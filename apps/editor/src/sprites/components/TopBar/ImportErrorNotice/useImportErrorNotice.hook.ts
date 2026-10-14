import { useEffect } from 'react'

import { IMPORT_FILE_ERROR_NOTICE_AUTO_DISMISS_MS } from '@/constants/file-menu'

/** Self-dismissing, like `useAccountDeletedNotice`; the timer restarts for each new message. */
export const useImportErrorNotice = (message: string, onDismiss: () => void): void => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, IMPORT_FILE_ERROR_NOTICE_AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [message, onDismiss])
}
