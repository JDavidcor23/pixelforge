import { Loader2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { DISABLED_STATE, FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'
import type { VariationCardState, VariationCardTone } from '@/types/audio'

interface VariationCardProps {
  icon: LucideIcon
  title: string
  subtitle: string
  tone: VariationCardTone
  state: VariationCardState
  onClick: () => void
}

const TONE_CLASSES: Record<VariationCardTone, { icon: string; card: string }> = {
  accent: { icon: 'text-accent', card: '' },
  ai: { icon: 'text-ai-ink', card: 'hover:border-ai/25' },
}

export function VariationCard({ icon: Icon, title, subtitle, tone, state, onClick }: VariationCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={state !== 'idle'}
      aria-busy={state === 'busy'}
      className={`flex items-center gap-3 rounded border border-line-strong p-3 text-left hover:bg-hover active:bg-raised ${TONE_CLASSES[tone].card} ${MOTION.PRESS} ${DISABLED_STATE} ${FOCUS_RING.BASE}`}
    >
      {state === 'busy' ? (
        <Loader2
          className={`size-4 shrink-0 animate-spin motion-reduce:animate-none ${TONE_CLASSES[tone].icon}`}
          aria-hidden
        />
      ) : (
        <Icon className={`size-4 shrink-0 ${TONE_CLASSES[tone].icon}`} aria-hidden />
      )}
      <span className="flex flex-col gap-0.5">
        <span className="text-ui font-medium text-ink">{title}</span>
        <span className="text-2xs text-subtle">{subtitle}</span>
      </span>
    </button>
  )
}
