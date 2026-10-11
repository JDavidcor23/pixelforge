import { Copy, MousePointer2, Scissors, Trash2 } from 'lucide-react'

import { InspectorSlider } from '../InspectorSlider/InspectorSlider'
import { useClipInspector } from './useClipInspector.hook'
import { DISABLED_STATE, FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'

const ACTION = `group flex items-center gap-1.5 rounded border border-line-strong px-2.5 py-1.5 text-xs text-ink hover:bg-hover ${MOTION.PRESS} ${FOCUS_RING.BASE} ${DISABLED_STATE}`

export function ClipInspector() {
  const {
    hasClip,
    assetName,
    meta,
    sliders,
    canSplitHere,
    handleSliderPointerDown,
    handleSplit,
    handleDuplicate,
    handleDelete,
  } = useClipInspector()

  if (!hasClip) {
    return (
      <div className="flex h-44 shrink-0 items-center justify-center gap-2 border-t border-line bg-base px-6">
        <MousePointer2 className="size-3.5 text-subtle" aria-hidden />
        <p className="text-xs text-muted">Select a clip to change its volume, speed and fades.</p>
      </div>
    )
  }

  return (
    <section
      aria-label="Selected clip"
      className="flex h-44 shrink-0 gap-8 border-t border-line bg-base px-6 py-4"
    >
      <div className="flex w-75 shrink-0 flex-col gap-2">
        <span className="self-start rounded bg-hover px-2 py-0.75 text-2xs font-medium text-muted">
          Selected clip
        </span>
        <h3 title={assetName} className="truncate font-mono text-lg font-semibold text-ink">
          {assetName}
        </h3>
        <p title={meta} className="line-clamp-2 text-xs text-muted">
          {meta}
        </p>
        <div className="flex gap-1.5 pt-2">
          <button type="button" onClick={handleSplit} disabled={!canSplitHere} className={ACTION}>
            <Scissors className="size-3.25 text-muted" aria-hidden />
            Split here
          </button>
          <button type="button" onClick={handleDuplicate} className={ACTION}>
            <Copy className="size-3.25 text-muted" aria-hidden />
            Duplicate
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className={`${ACTION} hover:border-danger/40 hover:bg-danger/10 hover:text-danger`}
          >
            <Trash2 className="size-3.25 text-muted group-hover:text-danger" aria-hidden />
            Delete
          </button>
        </div>
      </div>
      <div className="grid min-w-0 flex-1 grid-cols-2 content-start gap-x-8 gap-y-4.5">
        {sliders.map((slider) => (
          <InspectorSlider
            key={slider.key}
            label={slider.label}
            valueLabel={slider.valueLabel}
            lo={slider.lo}
            hi={slider.hi}
            value={slider.value}
            min={slider.min}
            max={slider.max}
            step={slider.step}
            onChange={slider.onChange}
            onPointerDown={handleSliderPointerDown}
          />
        ))}
      </div>
    </section>
  )
}
