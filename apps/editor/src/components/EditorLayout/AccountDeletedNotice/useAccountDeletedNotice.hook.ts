import { useCallback, useEffect } from 'react'

import { useEditorUIStore } from '@/stores/ui.store'
import { ACCOUNT_DELETED_NOTICE_AUTO_DISMISS_MS } from '@/constants/account-deletion'

/** Calm, self-dismissing confirmation shown once right after a successful account deletion. */
export function useAccountDeletedNotice() {
  const dismissAccountDeletedNotice = useEditorUIStore((state) => state.dismissAccountDeletedNotice)

  useEffect(() => {
    const timer = setTimeout(dismissAccountDeletedNotice, ACCOUNT_DELETED_NOTICE_AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [dismissAccountDeletedNotice])

  const handleDismiss = useCallback(() => {
    dismissAccountDeletedNotice()
  }, [dismissAccountDeletedNotice])

  return { handleDismiss }
}
