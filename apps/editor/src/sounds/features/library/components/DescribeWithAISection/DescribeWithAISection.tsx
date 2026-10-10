import { ArrowRight, Loader2, Plug, Sparkles } from 'lucide-react'

import { useDescribeWithAI } from './useDescribeWithAI.hook'
import { DISABLED_STATE, FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'

export function DescribeWithAISection() {
  const {
    headingId,
    errorId,
    autofocus,
    prompt,
    kinds,
    isConnected,
    isGenerating,
    canGenerate,
    generationError,
    handleKindKeyDown,
    handlePromptChange,
    handleSubmit,
    handleOpenSettings,
  } = useDescribeWithAI()

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2.5 border-y border-line p-4">
      <div className="flex items-center gap-1.5">
        <Sparkles className="size-3.25 text-ai-ink" aria-hidden />
        <h3 id={headingId} className="text-ui font-semibold text-ink">
          Describe it with AI
        </h3>
      </div>

      <div role="radiogroup" aria-label="Kind" onKeyDown={handleKindKeyDown} className="flex gap-1">
        {kinds.map((kind) => (
          <button
            key={kind.mode}
            type="button"
            role="radio"
            data-mode={kind.mode}
            aria-checked={kind.isChecked}
            tabIndex={kind.isChecked ? 0 : -1}
            onClick={kind.onSelect}
            className={`rounded border border-line px-2.5 py-1 text-xs text-subtle hover:text-muted aria-checked:bg-hover aria-checked:text-ink ${FOCUS_RING.RAISED}`}
          >
            {kind.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
        <input
          type="text"
          data-autofocus={autofocus}
          value={prompt}
          onChange={handlePromptChange}
          placeholder="e.g. wooden door creaking open"
          aria-label="Describe the sound"
          aria-describedby={generationError ? errorId : undefined}
          aria-invalid={generationError ? true : undefined}
          className={`h-9.5 w-full rounded border border-line bg-base px-2.5 text-ui text-ink placeholder:text-subtle ${FOCUS_RING.INPUT}`}
        />

        {generationError && (
          <p id={errorId} role="alert" className="text-xs text-danger">
            {generationError}
          </p>
        )}

        {isConnected ? (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!canGenerate}
              aria-busy={isGenerating}
              className={`flex items-center gap-1.5 rounded bg-ai px-3 py-1.75 text-ui font-semibold text-ink glow-ai hover:bg-ai/90 active:bg-ai/80 ${MOTION.PRESS} ${DISABLED_STATE} ${FOCUS_RING.RAISED_AI}`}
            >
              {isGenerating ? (
                <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden />
              ) : (
                <Sparkles className="size-3.5" aria-hidden />
              )}
              {isGenerating ? 'Generating…' : 'Generate'}
            </button>
          </div>
        ) : (
          <div className="flex items-start gap-2.5 rounded border border-ai/25 bg-ai/8 px-3 py-2.5">
            <Plug className="mt-px size-3.5 shrink-0 text-ai-ink" aria-hidden />
            <p className="flex-1 text-xs text-ink">Connect ElevenLabs once in Settings to use AI.</p>
            <button
              type="button"
              onClick={handleOpenSettings}
              className={`flex shrink-0 items-center gap-1 rounded text-xs font-semibold text-ai-ink-strong hover:underline ${FOCUS_RING.RAISED}`}
            >
              Open Settings
              <ArrowRight className="size-3" aria-hidden />
            </button>
          </div>
        )}
      </form>
    </section>
  )
}
