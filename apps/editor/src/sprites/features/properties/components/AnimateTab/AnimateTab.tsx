import { Film } from 'lucide-react'

import { AiResultCard } from '../AiResultCard/AiResultCard'
import { AssetTypeSelector } from '../CreateTab/AssetTypeSelector'
import { useAnimateTab } from './useAnimateTab.hook'
import { ANIMATE_CUSTOM_MOTION_PLACEHOLDER, SPRITE_ANIMATION } from '@/constants'
import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'
import type { AnimationDirection } from '@/types'

const FIELD = 'w-full rounded border border-line bg-base px-2 py-1.5 text-xs text-ink outline-none focus:border-accent'
const SECTION_LABEL = 'font-mono text-3xs uppercase tracking-wider text-subtle'

const capitalizeWords = (value: string) =>
  value
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

export const AnimateTab = () => {
  const {
    assetType,
    setAssetType,
    motions,
    motionId,
    setMotionId,
    motion,
    isCharacter,
    direction,
    setDirection,
    nFrames,
    setNFrames,
    customText,
    setCustomText,
    isGenerating,
    animError,
    handleGenerateAnimation,
    previewRef,
    handlePreviewReference,
    result,
    handleUseResult,
    handleDismissResult,
    recent,
    handleApplyRecent,
    handleSeeAllAssets,
  } = useAnimateTab()

  const isGenerateDisabled = isGenerating || (motion.isCustomInput && !customText.trim())

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className={SECTION_LABEL}>Animate sprite</span>
        <button
          type="button"
          onClick={handlePreviewReference}
          className={`text-2xs text-subtle hover:text-muted ${MOTION.COLORS}`}
        >
          Preview reference
        </button>
      </div>

      <AssetTypeSelector value={assetType} onChange={setAssetType} compact />

      {previewRef && (
        <div className="flex flex-col items-center gap-2 rounded-sm border border-line bg-base p-2">
          <span className="font-mono text-3xs font-bold uppercase tracking-widest text-subtle">
            AI input preview (64x64)
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element -- Vite SPA, no next/image available */}
          <img src={previewRef} alt="Reference preview" className="image-pixelated h-16 w-16 border border-line-strong" />
        </div>
      )}

      <p className="text-xs text-muted">
        {isCharacter
          ? 'Uses the current frame as the exact reference of the character and generates the chosen frames.'
          : `Uses the current frame as the exact reference of this ${assetType} and generates the chosen frames.`}
      </p>

      <div className={`grid gap-2 ${isCharacter ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <div>
          <label className={`mb-1 block ${SECTION_LABEL}`}>Motion</label>
          <select value={motionId} onChange={(e) => setMotionId(e.target.value)} className={FIELD}>
            {motions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {isCharacter && (
          <div>
            <label className={`mb-1 block ${SECTION_LABEL}`}>Direction</label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as AnimationDirection)}
              className={FIELD}
            >
              {SPRITE_ANIMATION.DIRECTIONS.map((d) => (
                <option key={d} value={d}>
                  {capitalizeWords(d)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {motion.isCustomInput && (
        <div>
          <label className={`mb-1 block ${SECTION_LABEL}`}>Describe the motion</label>
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            rows={2}
            placeholder={ANIMATE_CUSTOM_MOTION_PLACEHOLDER[assetType]}
            onKeyDown={(e) => e.stopPropagation()}
            onPaste={(e) => e.stopPropagation()}
            className="w-full resize-y rounded border border-line-strong bg-base p-2.5 text-xs leading-relaxed text-ink placeholder:text-subtle focus:border-ai-ink focus:outline-none"
          />
        </div>
      )}

      <div>
        <label className={`mb-1 block ${SECTION_LABEL}`}>Frames</label>
        <div className="flex gap-1">
          {SPRITE_ANIMATION.FRAME_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setNFrames(n)}
              className={`flex-1 rounded border py-1 text-2xs font-medium ${MOTION.COLORS} ${
                nFrames === n
                  ? 'border-ai/40 bg-ai/10 text-ai-ink'
                  : 'border-line-strong text-muted hover:border-line-strong/80'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {animError && (
        <div className="rounded-sm border border-danger/40 bg-danger/10 p-2">
          <p className="text-xs text-danger">{animError}</p>
        </div>
      )}

      <button
        type="button"
        onClick={handleGenerateAnimation}
        disabled={isGenerateDisabled}
        className={`flex h-9 w-full items-center justify-center gap-2 rounded bg-ai text-xs font-semibold text-ink ${MOTION.PRESS} ${FOCUS_RING.RAISED_AI} disabled:pointer-events-none disabled:opacity-40`}
      >
        {isGenerating ? (
          <>
            <div className="size-3 animate-spin rounded-full border-2 border-ink border-t-transparent motion-reduce:animate-none" />
            Generating…
          </>
        ) : (
          <>
            <Film size={14} aria-hidden />
            Generate Animation
          </>
        )}
      </button>

      {result && (
        <AiResultCard
          thumbnailSrc={result.frames[0] ?? ''}
          label={result.label}
          caption="Also saved in Assets."
          primaryLabel="Use on timeline"
          onPrimary={handleUseResult}
          secondaryLabel="Generate again"
          onSecondary={handleDismissResult}
          autoApplied={result.autoApplied}
          autoAppliedLabel="Applied to timeline"
        />
      )}

      {recent.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className={SECTION_LABEL}>Recent</span>
          <div className="flex flex-wrap gap-1.5">
            {recent.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleApplyRecent(item)}
                title={item.title}
                className={`size-10 shrink-0 overflow-hidden rounded-sm border border-line bg-base ${FOCUS_RING.SURFACE} ${MOTION.COLORS} hover:border-line-strong`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- Vite SPA, no next/image available */}
                <img src={item.thumbnailSrc} alt="" className="image-pixelated h-full w-full object-contain" />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleSeeAllAssets}
            className={`self-start text-2xs text-subtle underline-offset-2 hover:text-accent hover:underline ${MOTION.COLORS} ${FOCUS_RING.SURFACE}`}
          >
            See all in Assets
          </button>
        </div>
      )}
    </div>
  )
}
