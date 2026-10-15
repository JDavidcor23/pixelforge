import { Film, X } from 'lucide-react'

import { AiResultCard } from '../AiResultCard/AiResultCard'
import { AssetTypeSelector } from '../CreateTab/AssetTypeSelector'
import { ReferenceChip } from './ReferenceChip/ReferenceChip'
import { ReferencePicker } from './ReferencePicker/ReferencePicker'
import { UnfinishedJobs } from './UnfinishedJobs'
import { useAnimateTab } from './useAnimateTab.hook'
import { DANGER_BUTTON, SECONDARY_BUTTON, SECTION_LABEL } from './animate-tab.classes'
import { ANIMATE_CUSTOM_MOTION_PLACEHOLDER } from '@/constants'
import {
  ANIMATION_BUSY_MESSAGE,
  ANIMATION_CANCEL_HINT,
  ANIMATION_CANCEL_LABEL,
  ANIMATION_CHECK_AGAIN_LABEL,
  ANIMATION_DISCARD_HINT,
  ANIMATION_DISCARD_LABEL,
} from '@/constants/animation'
import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'

const FIELD = 'w-full rounded border border-line bg-sunken px-2 py-1.5 text-xs text-ink outline-none focus:border-accent'

export const AnimateTab = () => {
  const {
    assetType,
    setAssetType,
    motions,
    motionId,
    setMotionId,
    motion,
    isCharacter,
    nFrames,
    setNFrames,
    frameOptions,
    canvasSizeError,
    customText,
    setCustomText,
    isGenerating,
    elapsedLabel,
    runningLabel,
    progressHint,
    isStalled,
    stalledMessage,
    handleCheckAgain,
    handleDiscardJob,
    animError,
    isBusyError,
    handleGenerateAnimation,
    animationReference,
    isReferencePickerOpen,
    handleOpenReferencePicker,
    handleCloseReferencePicker,
    result,
    handleUseResult,
    handleDismissResult,
    recent,
    handleApplyRecent,
    handleDeleteRecent,
    handleSeeAllAssets,
  } = useAnimateTab()

  const isGenerateDisabled =
    isGenerating ||
    isStalled ||
    !!canvasSizeError ||
    !animationReference ||
    (motion.isCustomInput && !customText.trim())

  return (
    <div className="flex flex-col gap-3">
      <span className={SECTION_LABEL}>Animate sprite</span>

      <AssetTypeSelector value={assetType} onChange={setAssetType} compact />

      <p className="text-xs text-muted">
        {isCharacter
          ? 'Uses the current frame as the exact reference — same character, angle and size — and generates the chosen frames.'
          : `Uses the current frame as the exact reference of this ${assetType} — same angle and size — and generates the chosen frames.`}
      </p>

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
            className="w-full resize-y rounded border border-line-strong bg-sunken p-2.5 text-xs leading-relaxed text-ink placeholder:text-subtle focus:border-ai-ink focus:outline-none"
          />
        </div>
      )}

      <div>
        <label className={`mb-1 block ${SECTION_LABEL}`}>Frames</label>
        <div className="flex gap-1">
          {frameOptions.map((n) => (
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

      {canvasSizeError && (
        <div className="rounded-sm border border-danger/40 bg-danger/10 p-2">
          <p className="text-xs text-danger">{canvasSizeError}</p>
        </div>
      )}

      {isStalled && (
        <div className="flex flex-col gap-2 rounded-sm border border-ai/40 bg-ai/10 p-2">
          <p className="text-xs text-ai-ink">{stalledMessage}</p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleCheckAgain} className={SECONDARY_BUTTON}>
              {ANIMATION_CHECK_AGAIN_LABEL}
            </button>
            <button type="button" onClick={handleDiscardJob} className={SECONDARY_BUTTON}>
              {ANIMATION_DISCARD_LABEL}
            </button>
          </div>
          <p className="text-2xs text-subtle">{ANIMATION_DISCARD_HINT}</p>
        </div>
      )}

      {!canvasSizeError && !isStalled && animError && (
        <>
          {isBusyError ? (
            <div className="rounded-sm border border-ai/40 bg-ai/10 p-2">
              <p className="text-xs text-ai-ink">{ANIMATION_BUSY_MESSAGE}</p>
            </div>
          ) : (
            <div className="rounded-sm border border-danger/40 bg-danger/10 p-2">
              <p className="text-xs text-danger">{animError}</p>
            </div>
          )}
        </>
      )}

      <div>
        <label className={`mb-1 block ${SECTION_LABEL}`}>Reference</label>
        <ReferenceChip reference={animationReference} onOpenPicker={handleOpenReferencePicker} />
      </div>

      <button
        type="button"
        onClick={handleGenerateAnimation}
        disabled={isGenerateDisabled}
        className={`flex h-9 w-full items-center justify-center gap-2 rounded bg-ai text-xs font-semibold text-ink ${MOTION.PRESS} ${FOCUS_RING.RAISED_AI} disabled:pointer-events-none disabled:opacity-40`}
      >
        {isGenerating ? (
          <>
            <div className="size-3 animate-spin rounded-full border-2 border-ink border-t-transparent motion-reduce:animate-none" />
            {runningLabel} {elapsedLabel}
          </>
        ) : (
          <>
            <Film size={14} aria-hidden />
            Generate Animation
          </>
        )}
      </button>

      {isGenerating && !isStalled && (
        <div className="flex flex-col gap-2 rounded-sm border border-danger/40 bg-danger/10 p-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-2xs text-subtle">{progressHint}</p>
            <button type="button" onClick={handleDiscardJob} className={DANGER_BUTTON}>
              <X size={12} aria-hidden />
              {ANIMATION_CANCEL_LABEL}
            </button>
          </div>
          <p className="text-2xs text-subtle">{ANIMATION_CANCEL_HINT}</p>
        </div>
      )}

      {isReferencePickerOpen && <ReferencePicker onClose={handleCloseReferencePicker} />}

      <UnfinishedJobs />

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
              <div key={item.id} className="group relative size-10 shrink-0">
                <button
                  type="button"
                  onClick={() => handleApplyRecent(item)}
                  title={item.title}
                  className={`size-10 overflow-hidden rounded-sm border border-line bg-sunken ${FOCUS_RING.SURFACE} ${MOTION.COLORS} hover:border-line-strong`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- Vite SPA, no next/image available */}
                  <img src={item.thumbnailSrc} alt="" className="image-pixelated h-full w-full object-contain" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteRecent(item)
                  }}
                  aria-label={`Delete ${item.title}`}
                  title="Delete"
                  className={`absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full border border-line-strong bg-raised text-subtle opacity-0 hover:border-danger hover:text-danger group-hover:opacity-100 group-focus-within:opacity-100 pointer-coarse:opacity-100 ${MOTION.REVEAL} ${FOCUS_RING.SURFACE}`}
                >
                  <X size={9} aria-hidden />
                </button>
              </div>
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
