import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useApplyAsset } from '@/sprites/hooks/useApplyAsset.hook'
import {
  useFocusPromptRequest,
  useOpenSettings,
  useRetroDiffusionApiKey,
  useSetBottomPanelTab,
  useSpriteEditorStore,
  useToggleTimeline,
} from '@/sprites/hooks/useSpriteEditorStore.hook'
import { useEditorUIStore } from '@/stores/ui.store'
import { useAssetsStore } from '@/stores/assets.store'
import { generateSpriteWithRetroDiffusion } from '@/lib/retro-diffusion-utils'
import { isCanvasBlank } from '@/lib/canvas-blank'
import { buildPrompt } from '@/lib/build-prompt'
import {
  AI_SPRITE_DEFAULT_SIZE,
  AI_SPRITE_SIZES,
  ASSET_TYPE_EXAMPLE_CHIPS,
  ASSET_TYPE_PROMPT_PLACEHOLDER,
  ASSET_TYPE_STYLE,
  DEFAULT_GAME_TEMPLATE_ID,
  GAME_TEMPLATES,
  GAME_TEMPLATE_OFF_SUMMARY,
  GAME_TEMPLATE_TOOLTIP,
  RECENT_ASSETS_LIMIT,
} from '@/constants'
import { useAIJobsStore } from '@/stores/ai-jobs.store'
import type { AssetType, GameTemplateId, RecentGenerationItem } from '@/types'

export interface UseGeneratePanelParams {
  readonly assetType: AssetType
}

/**
 * Create tab > Generate. A successful generation is always ADDED to the
 * Assets library (`useAssetsStore`). Applying it to the canvas is a separate
 * step, shown as a result card right after generation: automatic when the
 * canvas is still blank, otherwise a "Use on canvas" button — see
 * `useApplyAsset.hook.ts` for the shared apply path (also used by the
 * Assets tab).
 */
export const useGeneratePanel = ({ assetType }: UseGeneratePanelParams) => {
  const apiKey = useRetroDiffusionApiKey()
  const openSettings = useOpenSettings()
  const addGeneration = useAssetsStore((s) => s.addGeneration)
  const generations = useAssetsStore((s) => s.generations)
  const { applyGeneration } = useApplyAsset()
  const setBottomPanelTab = useSetBottomPanelTab()
  const toggleTimeline = useToggleTimeline()
  const timelineOpen = useEditorUIStore((s) => s.ui.timelineOpen)

  // Request state lives in `useAIJobsStore`, not `useState`: the request keeps
  // running if this tab unmounts, and its result must be here when it remounts.
  const prompt = useAIJobsStore((s) => s.generatePrompt)
  const setPrompt = useAIJobsStore((s) => s.setGeneratePrompt)
  const isLoading = useAIJobsStore((s) => s.generate.isRunning)
  const error = useAIJobsStore((s) => s.generate.error)
  const result = useAIJobsStore((s) => s.generate.result)
  const setGenerateJob = useAIJobsStore((s) => s.setGenerateJob)
  const lastCostUsd = useAIJobsStore((s) => s.lastCostUsd)
  const remainingBalanceUsd = useAIJobsStore((s) => s.remainingBalanceUsd)
  const setBalance = useAIJobsStore((s) => s.setBalance)
  const [genSize, setGenSize] = useState<number>(AI_SPRITE_DEFAULT_SIZE)
  // Clicking the active template chip turns it off (null = prompt sent as-is).
  const [templateId, setTemplateId] = useState<GameTemplateId | null>(DEFAULT_GAME_TEMPLATE_ID)
  const template = templateId ? GAME_TEMPLATES[templateId] : null

  const handleToggleTemplate = useCallback(
    (id: GameTemplateId) => setTemplateId((current) => (current === id ? null : id)),
    [],
  )

  const promptRef = useRef<HTMLTextAreaElement | null>(null)
  const focusPromptRequest = useFocusPromptRequest()

  // One-shot: the Assets tab's "New asset"/"Open Create" bumps this nonce in
  // the UI store to ask this panel to focus the prompt. `0` means "never
  // requested" (see EditorUIState.ui), so the very first mount never steals
  // focus on its own.
  useEffect(() => {
    if (focusPromptRequest === 0) return
    promptRef.current?.focus()
  }, [focusPromptRequest])

  const handleUseExample = useCallback((prompt: string) => setPrompt(prompt), [setPrompt])

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || useAIJobsStore.getState().generate.isRunning) return

    try {
      setGenerateJob({ isRunning: true, error: null, result: null })

      const {
        base64,
        width,
        height,
        costUsd,
        remainingBalanceUsd: balance,
      } = await generateSpriteWithRetroDiffusion({
        // The library keeps the user's own words; only the request carries the rules.
        prompt: buildPrompt(prompt, template, assetType),
        width: genSize,
        height: genSize,
        style: ASSET_TYPE_STYLE[assetType],
        apiKey: apiKey ?? undefined,
      })

      addGeneration({ prompt, base64, width, height, assetType })
      setBalance(costUsd, balance)

      const canApplyAutomatically = isCanvasBlank(useSpriteEditorStore.getState().timeline.frames)
      if (canApplyAutomatically) await applyGeneration({ base64, width })
      setGenerateJob({ result: { base64, width, prompt, autoApplied: canApplyAutomatically } })
    } catch (e) {
      setGenerateJob({ error: e instanceof Error ? e.message : 'Generation failed' })
    } finally {
      setGenerateJob({ isRunning: false })
    }
  }, [prompt, template, genSize, assetType, apiKey, addGeneration, applyGeneration, setGenerateJob, setBalance])

  const handleUseResult = useCallback(async () => {
    if (!result) return
    await applyGeneration({ base64: result.base64, width: result.width })
    setGenerateJob({ result: { ...result, autoApplied: true } })
  }, [result, applyGeneration, setGenerateJob])

  const handleDismissResult = useCallback(() => setGenerateJob({ result: null }), [setGenerateJob])

  const recent = useMemo<RecentGenerationItem[]>(
    () =>
      generations.slice(0, RECENT_ASSETS_LIMIT).map((generation) => ({
        id: generation.id,
        title: generation.prompt,
        thumbnailSrc: generation.base64,
        base64: generation.base64,
        width: generation.width,
      })),
    [generations],
  )

  const handleApplyRecent = useCallback(
    (item: RecentGenerationItem) => applyGeneration({ base64: item.base64, width: item.width }),
    [applyGeneration],
  )

  const handleSeeAllAssets = useCallback(() => {
    setBottomPanelTab('assets')
    if (!timelineOpen) toggleTimeline()
  }, [setBottomPanelTab, timelineOpen, toggleTimeline])

  return {
    prompt,
    setPrompt,
    placeholder: ASSET_TYPE_PROMPT_PLACEHOLDER[assetType],
    examples: ASSET_TYPE_EXAMPLE_CHIPS[assetType],
    handleUseExample,
    templates: Object.values(GAME_TEMPLATES),
    templateId,
    handleToggleTemplate,
    templateSummary: template?.summary ?? GAME_TEMPLATE_OFF_SUMMARY,
    templateTooltip: GAME_TEMPLATE_TOOLTIP,
    genSize,
    setGenSize,
    sizes: AI_SPRITE_SIZES,
    error,
    isLoading,
    handleGenerate,
    lastCostUsd,
    remainingBalanceUsd,
    hasApiKey: !!apiKey,
    openSettings,
    promptRef,
    result,
    handleUseResult,
    handleDismissResult,
    recent,
    handleApplyRecent,
    handleSeeAllAssets,
  }
}
