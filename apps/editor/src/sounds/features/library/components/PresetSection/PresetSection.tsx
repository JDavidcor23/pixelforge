import { Loader2 } from 'lucide-react'

import { usePresetSection } from './usePresetSection.hook'
import { DISABLED_STATE, FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'

export function PresetSection() {
  const { headingId, tiles, isBusy, stopPreview } = usePresetSection()

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2.5 p-4">
      <div className="flex items-center justify-between">
        <h3 id={headingId} className="text-ui font-semibold text-ink">
          Start from a preset
        </h3>
        <span className="text-2xs text-subtle">Hover to preview</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {tiles.map((tile) => (
          <button
            key={tile.presetId}
            type="button"
            data-autofocus={tile.autofocus}
            disabled={isBusy}
            aria-busy={tile.isCreating}
            onClick={tile.onCreate}
            onPointerEnter={tile.onPreview}
            onPointerLeave={stopPreview}
            onFocus={tile.onFocus}
            onBlur={stopPreview}
            className={`group flex items-center gap-2 rounded border border-line bg-surface p-3 text-ui font-medium text-ink hover:border-accent/40 hover:bg-hover focus-visible:border-accent/40 focus-visible:bg-hover active:bg-raised ${MOTION.PRESS} ${DISABLED_STATE} ${FOCUS_RING.RAISED}`}
          >
            {tile.isCreating ? (
              <Loader2
                className="size-3.75 animate-spin text-accent motion-reduce:animate-none"
                aria-hidden
              />
            ) : (
              <tile.icon
                className="size-3.75 text-muted group-hover:text-accent group-focus-visible:text-accent"
                aria-hidden
              />
            )}
            {tile.label}
          </button>
        ))}
      </div>
    </section>
  )
}
