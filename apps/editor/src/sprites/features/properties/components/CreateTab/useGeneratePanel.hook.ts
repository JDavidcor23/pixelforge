import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useApplyAsset } from '@/sprites/hooks/useApplyAsset.hook'
import { useImportLibraryAssets } from '@/sprites/hooks/useImportLibraryAssets.hook'
import {
  useCreateQualityTier,
  useFocusPromptRequest,
  useOpenSettings,
  useRetroDiffusionApiKey,
  useSetBottomPanelTab,
  useSetCreateQualityTier,
  useSpriteEditorStore,
  useToggleTimeline,
} from '@/sprites/hooks/useSpriteEditorStore.hook'
import { useEditorUIStore } from '@/stores/ui.store'
import { useAssetsStore } from '@/stores/assets.store'
import { generateSpriteWithRetroDiffusion } from '@/lib/retro-diffusion-utils'
import { isCanvasBlank } from '@/lib/canvas-blank'
import { buildPrompt } from '@/lib/build-prompt'
import {
  AI_SPRITE_DEFAULT_SIZE_BY_ASSET_TYPE,
  AI_SPRITE_SIZES,
  ASSET_TYPE_EXAMPLE_CHIPS,
  ASSET_TYPE_PROMPT_PLACEHOLDER,
  ASSET_TYPE_STYLE_BY_QUALITY,
  DEFAULT_GAME_TEMPLATE_ID,
  GAME_TEMPLATES,
  GAME_TEMPLATE_OFF_SUMMARY,
  GAME_TEMPLATE_TOOLTIP,
  PROMPT_WORD_LIMIT,
  QUALITY_RECOMMENDATION_BY_ASSET_TYPE,
  QUALITY_TIER_COST_USD,
  RECENT_ASSETS_LIMIT,
  RETRO_DIFFUSION_PRO_MAX_SIZE,
} from '@/constants'
import { useAIJobsStore } from '@/stores/ai-jobs.store'
import type { AssetType, GameTemplateId, QualityTier, RecentGenerationItem } from '@/types'

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
  const removeGeneration = useAssetsStore((s) => s.removeGeneration)
  const { applyGeneration } = useApplyAsset()
  const {
    fileInputRef: importFileInputRef,
    isImporting,
    importError,
    handleOpenImportPicker,
    handleImportFiles,
  } = useImportLibraryAssets({ assetType })
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
  const remainingBalanceUsd = useAIJobsStore((s) => s.remainingBalanceUsd)
  const setBalance = useAIJobsStore((s) => s.setBalance)
  const [genSize, setGenSizeState] = useState<number>(AI_SPRITE_DEFAULT_SIZE_BY_ASSET_TYPE[assetType])
  // Once the user explicitly picks a size, their choice wins over the
  // per-asset-type default (see the effect below) for the rest of the session.
  const userPickedSizeRef = useRef(false)
  const setGenSize = useCallback((size: number) => {
    userPickedSizeRef.current = true
    setGenSizeState(size)
  }, [])

  // Switching asset type (step 1 chips) re-applies that type's default size —
  // unless the user already picked one themselves this session.
  useEffect(() => {
    if (userPickedSizeRef.current) return
    setGenSizeState(AI_SPRITE_DEFAULT_SIZE_BY_ASSET_TYPE[assetType])
  }, [assetType])

  // Clicking the active template chip turns it off (null = prompt sent as-is).
  const [templateId, setTemplateId] = useState<GameTemplateId | null>(DEFAULT_GAME_TEMPLATE_ID)
  const template = templateId ? GAME_TEMPLATES[templateId] : null

  // Persisted the same way as `createAssetType` (see ui.store.ts) — survives a reload.
  const qualityTier = useCreateQualityTier()
  const setQualityTierStore = useSetCreateQualityTier()
  // Once the user explicitly picks a tier, their choice wins over the
  // per-asset-type recommendation (see the effect below) for the rest of the
  // session — same ref-gated pattern as `userPickedSizeRef` above.
  const userPickedQualityRef = useRef(false)
  const setQualityTier = useCallback(
    (tier: QualityTier) => {
      userPickedQualityRef.current = true
      setQualityTierStore(tier)
    },
    [setQualityTierStore],
  )

  // Switching asset type re-applies that type's recommended tier — unless the
  // user already picked one themselves this session. Guarded by a
  // previous-asset-type ref (not just `[assetType]`, unlike the size effect
  // below) so a fresh mount never clobbers a tier restored from persisted
  // storage; it only reacts to an actual in-session switch.
  const previousAssetTypeRef = useRef(assetType)
  useEffect(() => {
    if (previousAssetTypeRef.current === assetType) return
    previousAssetTypeRef.current = assetType
    if (userPickedQualityRef.current) return
    setQualityTierStore(QUALITY_RECOMMENDATION_BY_ASSET_TYPE[assetType].tier)
  }, [assetType, setQualityTierStore])

  const style = ASSET_TYPE_STYLE_BY_QUALITY[qualityTier][assetType]
  const maxGenSize = qualityTier === 'best' ? RETRO_DIFFUSION_PRO_MAX_SIZE : null

  // `rd_pro__*` (Best) rejects sizes above RETRO_DIFFUSION_PRO_MAX_SIZE — if the
  // user had a larger size selected under Draft/Standard, switching to Best
  // must pull it back in range instead of sending a request that gets clamped
  // server-side to a size the user never chose.
  useEffect(() => {
    if (maxGenSize !== null && genSize > maxGenSize) setGenSizeState(maxGenSize)
  }, [maxGenSize, genSize])

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

  // Verified live 2026-10-11: prompts over PROMPT_WORD_LIMIT words make Retro
  // Diffusion zoom in and crop the character. Applies to every asset type.
  const promptWordCount = useMemo(() => {
    const trimmed = prompt.trim()
    return trimmed ? trimmed.split(/\s+/).length : 0
  }, [prompt])
  const isPromptOverWordLimit = promptWordCount > PROMPT_WORD_LIMIT

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
        style,
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
  }, [prompt, template, genSize, assetType, style, apiKey, addGeneration, applyGeneration, setGenerateJob, setBalance])

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

  const handleDeleteRecent = useCallback((item: RecentGenerationItem) => removeGeneration(item.id), [removeGeneration])

  const handleSeeAllAssets = useCallback(() => {
    setBottomPanelTab('assets')
    if (!timelineOpen) toggleTimeline()
  }, [setBottomPanelTab, timelineOpen, toggleTimeline])

  return {
    prompt,
    setPrompt,
    promptWordCount,
    isPromptOverWordLimit,
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
    maxGenSize,
    qualityTier,
    setQualityTier,
    error,
    isLoading,
    handleGenerate,
    // Flat per generation (see QUALITY_TIER_COST_USD) — known upfront from the
    // selected tier, unlike the old per-size table this replaced.
    estimatedCostUsd: QUALITY_TIER_COST_USD[qualityTier],
    remainingBalanceUsd,
    hasApiKey: !!apiKey,
    openSettings,
    promptRef,
    result,
    handleUseResult,
    handleDismissResult,
    recent,
    handleApplyRecent,
    handleDeleteRecent,
    handleSeeAllAssets,
    importFileInputRef,
    isImporting,
    importError,
    handleOpenImportPicker,
    handleImportFiles,
  }
}
