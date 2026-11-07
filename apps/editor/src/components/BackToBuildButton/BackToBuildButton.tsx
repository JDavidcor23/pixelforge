import { ArrowLeft } from 'lucide-react'

import { useBackToBuild } from '@/hooks/useBackToBuild.hook'
import { BACK_TO_BUILD_COPY } from '@/constants/back-to-build'
import { MOTION } from '@/constants/motion'

const BUTTON = `flex items-center gap-1.5 rounded px-2 py-1 text-xs text-muted hover:bg-hover hover:text-ink ${MOTION.COLORS}`

interface BackToBuildButtonProps {
  /** Focus ring matching the surface the button sits on (`FOCUS_RING.*`). */
  focusRing: string
}

export function BackToBuildButton({ focusRing }: BackToBuildButtonProps) {
  const handleBack = useBackToBuild()

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label={BACK_TO_BUILD_COPY.ARIA_LABEL}
      title={BACK_TO_BUILD_COPY.ARIA_LABEL}
      className={`${BUTTON} ${focusRing}`}
    >
      <ArrowLeft className="size-3.5" aria-hidden />
      {BACK_TO_BUILD_COPY.LABEL}
    </button>
  )
}
