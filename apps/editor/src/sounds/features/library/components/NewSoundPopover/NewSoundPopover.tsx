import { X } from 'lucide-react'

import { DescribeWithAISection } from '../DescribeWithAISection/DescribeWithAISection'
import { ImportRow } from '../ImportRow/ImportRow'
import { PresetSection } from '../PresetSection/PresetSection'
import { useNewSoundPopover } from './useNewSoundPopover.hook'
import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'

interface NewSoundPopoverProps {
  triggerRef: React.RefObject<HTMLButtonElement | null>
}

export function NewSoundPopover({ triggerRef }: NewSoundPopoverProps) {
  const { dialogRef, titleId, handleClose, handleKeyDown } = useNewSoundPopover(triggerRef)

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onKeyDown={handleKeyDown}
      className={`absolute -left-2.5 top-full z-50 mt-2.5 flex w-105 flex-col overflow-hidden rounded-md border border-line-strong bg-raised shadow-popover ${MOTION.POPOVER_ENTER}`}
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
        <h2 id={titleId} className="text-sm font-semibold text-ink">
          New sound
        </h2>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className={`rounded p-1 text-subtle hover:text-ink ${FOCUS_RING.RAISED}`}
        >
          <X className="size-3.5" aria-hidden />
        </button>
      </div>

      <PresetSection />
      <DescribeWithAISection />
      <ImportRow />
    </div>
  )
}
