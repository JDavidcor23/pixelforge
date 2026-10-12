import { Check, Coins, Info, Sparkles } from 'lucide-react'

import { AiResultCard } from '../AiResultCard/AiResultCard'
import { useGeneratePanel } from './useGeneratePanel.hook'
import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'
import type { AssetType } from '@/types'

const FIELD = 'w-full rounded border border-line bg-base px-2 py-2 text-xs text-ink outline-none focus:border-accent'
const SECTION_LABEL = 'font-mono text-3xs uppercase tracking-wider text-subtle'

interface GeneratePanelProps {
  readonly assetType: AssetType
}

export const GeneratePanel = ({ assetType }: GeneratePanelProps) => {
  const {
    prompt,
    setPrompt,
    placeholder,
    examples,
    handleUseExample,
    genSize,
    setGenSize,
    sizes,
    error,
    isLoading,
    handleGenerate,
    lastCostUsd,
    remainingBalanceUsd,
    hasApiKey,
    openSettings,
    promptRef,
    result,
    handleUseResult,
    handleDismissResult,
    templates,
    templateId,
    handleToggleTemplate,
    templateSummary,
    templateTooltip,
    recent,
    handleApplyRecent,
    handleSeeAllAssets,
  } = useGeneratePanel({ assetType })

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1">
          <span className={SECTION_LABEL}>Game template</span>
          <span title={templateTooltip} aria-label={templateTooltip} className="text-subtle">
            <Info size={12} />
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {templates.map((t) => {
            const isActive = templateId === t.id
            return (
              <button
                key={t.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => handleToggleTemplate(t.id)}
                title={t.summary}
                className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-2xs ${MOTION.COLORS} ${
                  isActive
                    ? 'border border-ai-ink bg-ai/20 text-ai-ink'
                    : 'border border-transparent bg-hover text-muted hover:text-ink'
                }`}
              >
                {isActive && <Check size={10} aria-hidden />}
                {t.label}
              </button>
            )
          })}
        </div>
        <p className="text-2xs text-subtle">{templateSummary}</p>
      </div>

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
          className="min-h-18 w-full resize-y rounded border border-line-strong bg-base p-2.5 text-xs leading-relaxed text-ink placeholder:text-subtle focus:border-ai-ink focus:outline-none"
        />
        {isLoading && (
          <div className="absolute right-2 top-2">
            <div className="size-3 animate-spin rounded-full border-2 border-ai-ink border-t-transparent motion-reduce:animate-none" />
          </div>
        )}
      </div>

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
            <option key={s} value={s}>
              {s}x{s}
            </option>
          ))}
        </select>
        <p className="mt-1 text-2xs text-subtle">Using the result will change the canvas to this size.</p>
      </div>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={!prompt.trim() || isLoading}
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
            Generate
          </>
        )}
      </button>

      {result && (
        <AiResultCard
          thumbnailSrc={result.base64}
          label={result.prompt}
          caption="Also saved in Assets."
          primaryLabel="Use on canvas"
          onPrimary={handleUseResult}
          secondaryLabel="Generate again"
          onSecondary={handleDismissResult}
          autoApplied={result.autoApplied}
          autoAppliedLabel="Applied to canvas"
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

      {!hasApiKey && (
        <button
          type="button"
          onClick={openSettings}
          className={`self-center text-2xs text-subtle underline-offset-2 hover:text-accent hover:underline ${MOTION.COLORS} ${FOCUS_RING.SURFACE}`}
        >
          Add your Retro Diffusion key in Settings
        </button>
      )}

      <div className="flex items-center gap-1.5 font-mono text-3xs text-subtle" title="Retro Diffusion">
        <Coins size={12} className="shrink-0" aria-hidden />
        <span className="min-w-0 flex-1 truncate">
          {lastCostUsd !== null ? `Est. $${lastCostUsd.toFixed(3)}` : 'No generation yet this session'}
        </span>
        {remainingBalanceUsd !== null && (
          <span className="shrink-0">${remainingBalanceUsd.toFixed(2)} left</span>
        )}
      </div>
    </div>
  )
}
