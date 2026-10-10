import { AudioLines, Plus } from 'lucide-react'

import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'
import type { LibraryEmptyVariant } from '@/types/audio'

interface LibraryEmptyStateProps {
  variant: LibraryEmptyVariant
  query: string
  /** Label of the active kind filter, when one is set ("Music"). */
  filterLabel: string | null
  onClearSearch: () => void
  onNewSound: () => void
}

export function LibraryEmptyState({ variant, query, filterLabel, onClearSearch, onNewSound }: LibraryEmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
      {variant === 'empty' ? (
        <>
          <AudioLines className="size-6 text-subtle" aria-hidden />
          <p className="text-ui font-medium text-ink">No sounds yet</p>
          <p className="text-xs text-muted">
            Create one from a preset, describe it with AI, or import a file.
          </p>
          <button
            type="button"
            onClick={onNewSound}
            className={`group mt-1 flex items-center gap-1.5 rounded border border-line-strong px-3 py-2 text-ui text-ink hover:bg-hover active:bg-raised ${MOTION.PRESS} ${FOCUS_RING.SURFACE}`}
          >
            <Plus className="size-3.5 text-muted group-hover:text-accent" aria-hidden />
            New sound
          </button>
        </>
      ) : (
        <>
          <p className="line-clamp-3 max-w-full text-ui font-medium wrap-anywhere text-ink">
            {query ? `No sounds match “${query}”` : `No ${filterLabel ?? ''} sounds yet`}
          </p>
          <p className="text-xs text-muted">
            {query ? 'Try another name or clear the filter.' : 'Make one with New sound, or show every sound.'}
          </p>
          <button
            type="button"
            onClick={onClearSearch}
            className={`rounded text-xs font-medium text-accent underline-offset-2 hover:underline ${FOCUS_RING.SURFACE}`}
          >
            {query ? 'Clear search' : 'Show all sounds'}
          </button>
        </>
      )}
    </div>
  )
}
