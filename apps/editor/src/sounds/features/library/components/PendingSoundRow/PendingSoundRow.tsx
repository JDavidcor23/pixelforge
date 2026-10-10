import { Loader2 } from 'lucide-react'

import { MOTION } from '@/constants/motion'

interface PendingSoundRowProps {
  prompt: string
}

/** Placeholder row for an AI generation in flight — visible, not selectable. */
export function PendingSoundRow({ prompt }: PendingSoundRowProps) {
  return (
    <div
      role="option"
      aria-selected={false}
      aria-disabled="true"
      aria-busy="true"
      title={prompt}
      className={`flex h-12 shrink-0 items-center gap-2.5 rounded border border-transparent px-2.5 py-2 ${MOTION.ENTER}`}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-mono text-xs text-muted">{prompt}</span>
        <span className="text-2xs text-ai-ink">Generating…</span>
      </div>
      <Loader2
        className="size-3.5 shrink-0 animate-spin text-ai-ink motion-reduce:animate-none"
        aria-hidden
      />
    </div>
  )
}
