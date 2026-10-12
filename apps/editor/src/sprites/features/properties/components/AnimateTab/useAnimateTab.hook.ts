import { useCallback, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'

import { useApplyAsset } from '@/sprites/hooks/useApplyAsset.hook'
import {
  useLastAIReferenceBase64,
  useCreateAssetType,
  useSetCreateAssetType,
  useRetroDiffusionApiKey,
  useSpriteEditorStore,
} from '@/sprites/hooks/useSpriteEditorStore.hook'
import { useAssetsStore } from '@/stores/assets.store'
import { animationSheetCache } from '@/lib/animation-sheet-cache'
import { isCanvasBlank } from '@/lib/canvas-blank'
import { generateAnimationWithRetroDiffusion, sliceAnimationSheet } from '@/lib/retro-diffusion-utils'
import {
  AI_SPRITE_DEFAULT_SIZE,
  ANIMATE_DEFAULT_MOTION_ID,
  ANIMATE_MOTIONS_BY_ASSET_TYPE,
  ANIMATION_PIPELINE_VERSION,
  RETRO_DIFFUSION_CHARACTER_ANIMATION_PROMPT,
  RETRO_DIFFUSION_MOTION_REJECTED_HINT,
  RETRO_DIFFUSION_OBJECT_ANIMATION_PROMPT,
  SPRITE_ANIMATION,
} from '@/constants'
import { useAIJobsStore } from '@/stores/ai-jobs.store'
import type {
  AIAnimation,
  AnimateMotionOption,
  AnimateResult,
  AnimationDirection,
  AssetType,
  RetroDiffusionAnimationAction,
} from '@/types'

export interface UseAnimateTabReturn {
  assetType: AssetType
  setAssetType: (type: AssetType) => void
  motions: readonly AnimateMotionOption[]
  motionId: string
  setMotionId: Dispatch<SetStateAction<string>>
  motion: AnimateMotionOption
  isCharacter: boolean
  direction: AnimationDirection
  setDirection: Dispatch<SetStateAction<AnimationDirection>>
  nFrames: number
  setNFrames: Dispatch<SetStateAction<number>>
  customText: string
  setCustomText: Dispatch<SetStateAction<string>>
  isGenerating: boolean
  animError: string | null
  handleGenerateAnimation: () => Promise<void>
  previewRef: string | null
  handlePreviewReference: () => Promise<void>
  result: AnimateResult | null
  handleUseResult: () => Promise<void>
  handleDismissResult: () => void
}

/**
 * Advanced-animation styles that were NOT probed live against the Retro
 * Diffusion API (see the comment above `ANIMATE_CHARACTER_MOTIONS` in
 * constants/index.ts) — an upstream rejection on one of these gets a
 * friendlier hint appended instead of surfacing the raw API error verbatim.
 */
const UNVERIFIED_RD_ACTIONS = new Set<RetroDiffusionAnimationAction>(['crouch', 'destroy', 'subtle_motion'])

export const useAnimateTab = (): UseAnimateTabReturn => {
  const { applyAnimation } = useApplyAsset()
  const layers = useSpriteEditorStore((s) => s.layers)
  const lastAIReferenceBase64 = useLastAIReferenceBase64()
  const retroDiffusionApiKey = useRetroDiffusionApiKey()
  const addAnimation = useAssetsStore((s) => s.addAnimation)
  const markSheetAvailable = useAssetsStore((s) => s.markSheetAvailable)

  // Shared with the Create tab (lifted into the UI store, batch 2) — animating
  // a non-character asset should still animate the type the user already chose.
  const assetType = useCreateAssetType()
  const setCreateAssetType = useSetCreateAssetType()

  const motions = ANIMATE_MOTIONS_BY_ASSET_TYPE[assetType]
  const [motionId, setMotionId] = useState<string>(ANIMATE_DEFAULT_MOTION_ID[assetType])
  const [direction, setDirection] = useState<AnimationDirection>(
    SPRITE_ANIMATION.DEFAULT_DIRECTION as AnimationDirection,
  )
  const [nFrames, setNFrames] = useState<number>(SPRITE_ANIMATION.DEFAULT_N_FRAMES)
  const [customText, setCustomText] = useState('')
  const [previewRef, setPreviewRef] = useState<string | null>(null)
  // Request state lives in `useAIJobsStore` so it survives this tab unmounting.
  const isGenerating = useAIJobsStore((s) => s.animate.isRunning)
  const animError = useAIJobsStore((s) => s.animate.error)
  const result = useAIJobsStore((s) => s.animate.result)
  const setAnimateJob = useAIJobsStore((s) => s.setAnimateJob)
  const setAnimError = useCallback((error: string) => setAnimateJob({ error }), [setAnimateJob])
  const setResult = useCallback((next: AnimateResult | null) => setAnimateJob({ result: next }), [setAnimateJob])

  const motion = motions.find((option) => option.id === motionId) ?? motions[0]
  const isCharacter = assetType === 'character'

  // Changing the type resets to ITS default motion — e.g. a `crouch`
  // selection carried over from `character` has no equivalent in the
  // object/weapon/costume/effect motion list.
  const setAssetType = useCallback(
    (next: AssetType) => {
      setCreateAssetType(next)
      setMotionId(ANIMATE_DEFAULT_MOTION_ID[next])
      setCustomText('')
    },
    [setCreateAssetType],
  )

  const handlePreviewReference = useCallback(async () => {
    if (lastAIReferenceBase64) {
      setPreviewRef(lastAIReferenceBase64)
      return
    }
    const { layersToBase64 } = await import('@/lib/export-utils')
    const ref = layersToBase64(AI_SPRITE_DEFAULT_SIZE, AI_SPRITE_DEFAULT_SIZE, layers)
    setPreviewRef(ref)
  }, [layers, lastAIReferenceBase64])

  const handleGenerateAnimation = useCallback(async () => {
    if (motion.isCustomInput && !customText.trim()) return
    if (useAIJobsStore.getState().animate.isRunning) return

    try {
      setAnimateJob({ isRunning: true, error: null, result: null })

      const { layersToBase64, pixelBufferToDataUri } = await import('@/lib/export-utils')
      // Prefer the native-resolution AI generation over a re-render of the
      // (already downscaled/quantized) canvas — the model gets full detail to
      // anchor the animation to, instead of a lossier copy of itself.
      const referenceBase64 =
        lastAIReferenceBase64 ?? layersToBase64(AI_SPRITE_DEFAULT_SIZE, AI_SPRITE_DEFAULT_SIZE, layers)

      if (!referenceBase64) {
        setAnimError('Could not export the current frame as a reference.')
        return
      }

      const motionText = motion.isCustomInput
        ? customText.trim()
        : (motion.fixedMotionText ?? motion.label.toLowerCase())
      const prompt = isCharacter
        ? RETRO_DIFFUSION_CHARACTER_ANIMATION_PROMPT(motionText, direction)
        : RETRO_DIFFUSION_OBJECT_ANIMATION_PROMPT(motionText, assetType)

      const { base64 } = await generateAnimationWithRetroDiffusion({
        prompt,
        rdAction: motion.rdAction,
        frames: nFrames,
        size: AI_SPRITE_DEFAULT_SIZE,
        referenceBase64,
        apiKey: retroDiffusionApiKey ?? undefined,
      })
      const frames = await sliceAnimationSheet(base64, AI_SPRITE_DEFAULT_SIZE, nFrames)

      if (frames.length === 0) {
        setAnimError('The animation sheet came back empty or at an unexpected size.')
        return
      }

      // Store history as already-cropped, small PNG data-URIs (64x64 each),
      // never the raw ~1MB sheet — keeps localStorage light and thumbnails clean.
      const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)
      const label = isCharacter ? `${motion.label} · ${capitalize(direction)}` : motion.label
      const newAnimation: AIAnimation = {
        pipelineVersion: ANIMATION_PIPELINE_VERSION,
        id: crypto.randomUUID(),
        label,
        frames: frames.map((frame) => pixelBufferToDataUri(frame)),
        frameDurationMs: SPRITE_ANIMATION.DEFAULT_FRAME_DURATION_MS,
        timestamp: Date.now(),
        assetType,
      }
      addAnimation(newAnimation)
      animationSheetCache.set(newAnimation.id, base64)
      markSheetAvailable(newAnimation.id)

      const canApplyAutomatically = isCanvasBlank(useSpriteEditorStore.getState().timeline.frames)
      if (canApplyAutomatically) {
        await applyAnimation({ frames: newAnimation.frames, frameDurationMs: newAnimation.frameDurationMs })
      }
      setResult({
        frames: newAnimation.frames,
        frameDurationMs: newAnimation.frameDurationMs,
        label,
        autoApplied: canApplyAutomatically,
      })
    } catch (e) {
      const message = e instanceof Error ? e.message : ''
      const isUnverified = UNVERIFIED_RD_ACTIONS.has(motion.rdAction)
      if (isUnverified) {
        setAnimError(message ? `${message} — ${RETRO_DIFFUSION_MOTION_REJECTED_HINT}` : RETRO_DIFFUSION_MOTION_REJECTED_HINT)
      } else {
        setAnimError(message || 'Animation generation failed.')
      }
    } finally {
      setAnimateJob({ isRunning: false })
    }
  }, [
    setAnimateJob,
    setAnimError,
    setResult,
    motion,
    customText,
    isCharacter,
    direction,
    assetType,
    nFrames,
    layers,
    lastAIReferenceBase64,
    applyAnimation,
    retroDiffusionApiKey,
    addAnimation,
    markSheetAvailable,
  ])

  const handleUseResult = useCallback(async () => {
    if (!result) return
    await applyAnimation({ frames: result.frames, frameDurationMs: result.frameDurationMs })
    setResult({ ...result, autoApplied: true })
  }, [result, applyAnimation, setResult])

  const handleDismissResult = useCallback(() => setResult(null), [setResult])

  return {
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
  }
}
