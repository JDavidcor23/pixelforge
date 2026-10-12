import { Check } from 'lucide-react'

import { useSaveIndicator } from './useSaveIndicator.hook'

export const SaveIndicator = () => {
  const indicator = useSaveIndicator()

  return (
    <span className="flex items-center gap-1 text-2xs text-subtle">
      {indicator.kind === 'saving' && <span>Saving…</span>}
      {indicator.kind === 'saved' && (
        <span className="flex items-center gap-1" title={indicator.title}>
          <Check size={12} className="text-accent" aria-hidden />
          Saved on this device
        </span>
      )}
      {indicator.kind === 'not-saved' && (
        <span className="text-danger" title={indicator.title}>
          Not saved
        </span>
      )}
    </span>
  )
}
