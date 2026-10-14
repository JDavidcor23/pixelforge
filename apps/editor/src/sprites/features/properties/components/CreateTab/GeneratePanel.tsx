import { Coins, Sparkles } from 'lucide-react'

import { useGeneratePanel } from './useGeneratePanel.hook'
import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'
import type { AssetType, QualityTier } from '@/types'

const FIELD = 'w-full rounded border border-line bg-sunken px-2 py-2 text-xs text-ink outline-none focus:border-accent'
const SECTION_LABEL = 'font-mono text-3xs uppercase tracking-wider text-subtle'

interface GeneratePanelProps {
  readonly assetType: AssetType
  // Owned by `useCreateTab.hook.ts` — `CreateTab` renders `QualitySelector`
  // itself, right after the asset-type chips, so this panel only needs the
  // current tier to compute style/cost, not to render the picker.
  readonly qualityTier: QualityTier
}

export const GeneratePanel = ({ assetType, qualityTier }: GeneratePanelProps) => {
  const {
    prompt,
    setPrompt,
    promptCharCount,
    isPromptOverCharLimit,
    promptCharLimitWarning,
    placeholder,
    examples,
    handleUseExample,
    genSize,
    setGenSize,
    sizes,
    maxGenSize,
    error,
    isLoading,
    handleGenerate,
    estimatedCostUsd,
    remainingBalanceUsd,
    hasApiKey,
    openSettings,
    promptRef,
  } = useGeneratePanel({ assetType, qualityTier })

  return (
    <div className="flex flex-col gap-3">
      <span className={SECTION_LABEL}>3 · Describe it</span>

      <div className="relative">
        <textarea
          ref={promptRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder={placeholder}
          onKeyDown={(e) => e.stopPropagation()}
          onPaste={(e) => e.stopPropagation()}
          className="min-h-18 w-full resize-y rounded border border-line-strong bg-sunken p-2.5 text-xs leading-relaxed text-ink placeholder:text-subtle focus:border-ai-ink focus:outline-none"
        />
        {isLoading && (
          <div className="absolute right-2 top-2">
            <div className="size-3 animate-spin rounded-full border-2 border-ai-ink border-t-transparent motion-reduce:animate-none" />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className={`text-2xs ${isPromptOverCharLimit ? 'text-danger' : 'text-subtle'}`}>
          {promptCharCount} character{promptCharCount === 1 ? '' : 's'}
        </p>
        {isPromptOverCharLimit && <p className="text-2xs text-danger">{promptCharLimitWarning}</p>}
      </div>

      {assetType === 'character' && (
        <p className="text-2xs text-subtle">Describe the character only — not the scene or camera.</p>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-2xs text-subtle">Try:</span>
        {examples.map((example) => (
          <button
            key={example.label}
            type="button"
            onClick={() => handleUseExample(example.prompt)}
            title={example.prompt}
            className={`rounded bg-hover px-1.5 py-0.5 text-2xs text-muted hover:text-ink ${MOTION.COLORS}`}
          >
            {example.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-sm border border-danger/40 bg-danger/10 p-2">
          <p className="text-xs text-danger">{error}</p>
        </div>
      )}

      <div>
        <label className={`mb-1 block ${SECTION_LABEL}`}>Output size</label>
        <select value={genSize} onChange={(e) => setGenSize(Number(e.target.value))} className={FIELD}>
          {sizes.map((s) => (
            <option key={s} value={s} disabled={maxGenSize !== null && s > maxGenSize}>
              {s}x{s}
            </option>
          ))}
        </select>
        <p className="mt-1 text-2xs text-subtle">Using the result will change the canvas to this size.</p>
        {maxGenSize !== null && (
          <p className="mt-1 text-2xs text-subtle">Best quality supports sizes up to {maxGenSize}x{maxGenSize}.</p>
        )}
      </div>

      {!hasApiKey && (
        <button
          type="button"
          onClick={openSettings}
          className={`self-center text-2xs text-subtle underline-offset-2 hover:text-accent hover:underline ${MOTION.COLORS} ${FOCUS_RING.SURFACE}`}
        >
          Add your Retro Diffusion key in Settings
        </button>
      )}

      <button
        type="button"
        onClick={handleGenerate}
        disabled={!prompt.trim() || !hasApiKey || isLoading}
        className={`flex h-9 w-full items-center justify-center gap-2 rounded bg-ai text-xs font-semibold text-ink ${MOTION.PRESS} ${FOCUS_RING.RAISED_AI} disabled:pointer-events-none disabled:opacity-40`}
      >
        {isLoading ? (
          <>
            <div className="size-3 animate-spin rounded-full border-2 border-ink border-t-transparent motion-reduce:animate-none" />
            Generating…
          </>
        ) : (
          <>
            <Sparkles size={14} aria-hidden />
            Create with AI
          </>
        )}
      </button>

      <div className="flex items-center gap-1.5 font-mono text-3xs text-subtle" title="Retro Diffusion">
        <Coins size={12} className="shrink-0" aria-hidden />
        <span className="min-w-0 flex-1 truncate">
          {`Est. $${estimatedCostUsd.toFixed(2)}`}
          {remainingBalanceUsd !== null && ` · Balance $${remainingBalanceUsd.toFixed(2)}`}
        </span>
      </div>
    </div>
  )
}
