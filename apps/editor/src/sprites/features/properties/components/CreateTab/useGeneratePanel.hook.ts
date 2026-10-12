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
  AI_SPRITE_DEFAULT_SIZE,
  AI_SPRITE_SIZES,
  ASSET_TYPE_EXAMPLE_CHIPS,
  ASSET_TYPE_PROMPT_PLACEHOLDER,
  ASSET_TYPE_STYLE,
  DEFAULT_GAME_TEMPLATE_ID,
  GAME_TEMPLATES,
  GAME_TEMPLATE_OFF_SUMMARY,
  GAME_TEMPLATE_TOOLTIP,
} from '@/constants'
import type { AssetType, GameTemplateId } from '@/types'

export interface UseGeneratePanelParams {
  readonly assetType: AssetType
}

export interface GenerateResult {
  readonly base64: string
  readonly width: number
  readonly prompt: string
  readonly autoApplied: boolean
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
  const { applyGeneration } = useApplyAsset()

  const [prompt, setPrompt] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [genSize, setGenSize] = useState<number>(AI_SPRITE_DEFAULT_SIZE)
  const [lastCostUsd, setLastCostUsd] = useState<number | null>(null)
  const [remainingBalanceUsd, setRemainingBalanceUsd] = useState<number | null>(null)
  const [result, setResult] = useState<GenerateResult | null>(null)
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

  const handleUseExample = useCallback((prompt: string) => setPrompt(prompt), [])

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return

    try {
      setIsLoading(true)
      setError(null)
      setResult(null)

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
      setLastCostUsd(costUsd)
      setRemainingBalanceUsd(balance)

      const canApplyAutomatically = isCanvasBlank(useSpriteEditorStore.getState().timeline.frames)
      if (canApplyAutomatically) await applyGeneration({ base64, width })
      setResult({ base64, width, prompt, autoApplied: canApplyAutomatically })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      setIsLoading(false)
    }
  }, [prompt, template, genSize, assetType, apiKey, addGeneration, applyGeneration])

  const handleUseResult = useCallback(async () => {
    if (!result) return
    await applyGeneration({ base64: result.base64, width: result.width })
    setResult({ ...result, autoApplied: true })
  }, [result, applyGeneration])

  const handleDismissResult = useCallback(() => setResult(null), [])

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
  }
}
