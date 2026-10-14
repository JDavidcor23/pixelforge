import { useCallback, useEffect, useRef, useState } from 'react'

import { useApplyAsset } from '@/sprites/hooks/useApplyAsset.hook'
import {
  useFocusPromptRequest,
  useOpenSettings,
  useRetroDiffusionApiKey,
  useSpriteEditorStore,
} from '@/sprites/hooks/useSpriteEditorStore.hook'
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
  PROMPT_CHAR_LIMIT,
  PROMPT_CHAR_LIMIT_WARNING,
  QUALITY_TIER_COST_USD,
  RETRO_DIFFUSION_PRO_MAX_SIZE,
} from '@/constants'
import { useAIJobsStore } from '@/stores/ai-jobs.store'
import type { AssetType, QualityTier } from '@/types'

export interface UseGeneratePanelParams {
  readonly assetType: AssetType
  // Owned by `useCreateTab.hook.ts` (Sprite Studio v3, S13) — `CreateTab`
  // renders `QualitySelector` itself now, ahead of this panel, so this hook
  // only reads the current tier instead of owning its state/effects.
  readonly qualityTier: QualityTier
}

// Platformer is the only game template today (see GAME_TEMPLATES) and always
// applies — Sprite Studio v3 dropped the on/off chip row, so its rules are no
// longer user-toggleable, only built into every prompt via `buildPrompt`.
const ACTIVE_GAME_TEMPLATE = GAME_TEMPLATES[DEFAULT_GAME_TEMPLATE_ID]

/**
 * Create tab > Generate. A successful generation is always ADDED to the
 * Assets library (`useAssetsStore`) and never listed inside Create itself —
 * applying it to the canvas happens automatically when the canvas is still
 * blank (see `isCanvasBlank`/`applyGeneration`), otherwise the user applies it
 * later from the bottom panel's Assets tab.
 */
export const useGeneratePanel = ({ assetType, qualityTier }: UseGeneratePanelParams) => {
  const apiKey = useRetroDiffusionApiKey()
  const openSettings = useOpenSettings()
  const addGeneration = useAssetsStore((s) => s.addGeneration)
  const { applyGeneration } = useApplyAsset()

  // Request state lives in `useAIJobsStore`, not `useState`: the request keeps
  // running if this tab unmounts, and its result must be here when it remounts.
  const prompt = useAIJobsStore((s) => s.generatePrompt)
  const setPrompt = useAIJobsStore((s) => s.setGeneratePrompt)
  const isLoading = useAIJobsStore((s) => s.generate.isRunning)
  const error = useAIJobsStore((s) => s.generate.error)
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

  const style = ASSET_TYPE_STYLE_BY_QUALITY[qualityTier][assetType]
  const maxGenSize = qualityTier === 'best' ? RETRO_DIFFUSION_PRO_MAX_SIZE : null

  // `rd_pro__*` (Best) rejects sizes above RETRO_DIFFUSION_PRO_MAX_SIZE — if the
  // user had a larger size selected under Draft/Standard, switching to Best
  // must pull it back in range instead of sending a request that gets clamped
  // server-side to a size the user never chose.
  useEffect(() => {
    if (maxGenSize !== null && genSize > maxGenSize) setGenSizeState(maxGenSize)
  }, [maxGenSize, genSize])

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

  const promptCharCount = prompt.length

  // Verified live 2026-10-11: long prompts make Retro Diffusion zoom in and
  // crop the character (see PROMPT_CHAR_LIMIT in constants/index.ts, derived
  // from the verified word-count threshold). The visible counter is
  // character-based, so this warning is checked in the same unit instead of
  // pairing a character count with a word-based message.
  const isPromptOverCharLimit = promptCharCount > PROMPT_CHAR_LIMIT

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
        prompt: buildPrompt(prompt, ACTIVE_GAME_TEMPLATE, assetType),
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
  }, [prompt, genSize, assetType, style, apiKey, addGeneration, applyGeneration, setGenerateJob, setBalance])

  return {
    prompt,
    setPrompt,
    promptCharCount,
    isPromptOverCharLimit,
    promptCharLimitWarning: PROMPT_CHAR_LIMIT_WARNING,
    placeholder: ASSET_TYPE_PROMPT_PLACEHOLDER[assetType],
    examples: ASSET_TYPE_EXAMPLE_CHIPS[assetType],
    handleUseExample,
    genSize,
    setGenSize,
    sizes: AI_SPRITE_SIZES,
    maxGenSize,
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
  }
}
