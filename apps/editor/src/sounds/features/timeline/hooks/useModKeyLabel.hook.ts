import { useMemo } from 'react'

import { isMacPlatform, modKeyLabel } from '@/lib/timeline-shortcuts'

/** Whether to show ⌘ (macOS) or Ctrl in shortcut hints. */
export function useModKeyLabel() {
  const isMac = useMemo(
    () => typeof navigator !== 'undefined' && isMacPlatform(`${navigator.platform} ${navigator.userAgent}`),
    []
  )
  return { isMac, modLabel: modKeyLabel(isMac) }
}
