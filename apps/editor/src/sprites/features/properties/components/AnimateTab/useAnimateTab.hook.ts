import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'

import { useApplyAsset } from '@/sprites/hooks/useApplyAsset.hook'
import {
  useCanvasDimensions,
  useCreateAssetType,
  usePixelLabApiKey,
  useSetBottomPanelTab,
  useSetCreateAssetType,
  useSpriteEditorStore,
  useToggleTimeline,
} from '@/sprites/hooks/useSpriteEditorStore.hook'
import { useEditorUIStore } from '@/stores/ui.store'
import { useAssetsStore } from '@/stores/assets.store'
import { useAIJobsStore } from '@/stores/ai-jobs.store'
import { ANIMATION_HARNESS, buildAnimationAction, findAnimationMotion } from '@/lib/animation-harness'
import { allowedFrameCounts, getAnimationFrameCountError, getAnimationSizeError } from '@/lib/animation-limits'
import { isCanvasBlank } from '@/lib/canvas-blank'
import { AnimationProviderError, resolveAnimationProvider } from '@/services/animation-provider.service'
import {
  ANIMATION_PIPELINE_VERSION,
  MS_PER_SECOND,
  RECENT_ASSETS_LIMIT,
  SPRITE_ANIMATION,
} from '@/constants'
import {
  ANIMATION_ALREADY_RUNNING_ERROR,
  ANIMATION_ELAPSED_TICK_MS,
  ANIMATION_GENERIC_ERROR,
  ANIMATION_POLL_INTERVAL_MS,
  ANIMATION_POLL_MAX_CONSECUTIVE_ERRORS,
  ANIMATION_POLL_TIMEOUT_MS,
  ANIMATION_REFERENCE_EXPORT_ERROR,
  ANIMATION_SECONDS_PER_MINUTE,
  ANIMATION_TIMEOUT_ERROR,
} from '@/constants/animation'
import type {
  AIAnimation,
  AnimateResult,
  AnimationErrorCode,
  AnimationJobStatus,
  AnimationMotionPreset,
  AssetType,
  PendingAnimationJob,
  RecentAnimationItem,
} from '@/types'

export interface UseAnimateTabReturn {
  assetType: AssetType
  setAssetType: (type: AssetType) => void
  motions: readonly AnimationMotionPreset[]
  motionId: string
  /** Also resets `nFrames` to the motion's harness default. */
  setMotionId: (id: string) => void
  motion: AnimationMotionPreset
  isCharacter: boolean
  nFrames: number
  setNFrames: (frames: number) => void
  /** Even frame counts that fit the provider's pixel budget at the current canvas size. */
  frameOptions: readonly number[]
  customText: string
  setCustomText: Dispatch<SetStateAction<string>>
  /** The animation is generated at — and returns — the current canvas size. */
  canvasSize: { readonly width: number; readonly height: number }
  /** Non-null when the canvas cannot be animated as-is (not square, too large). */
  canvasSizeError: string | null
  isGenerating: boolean
  /** `Date.now()` when the running job was submitted, or null. */
  jobStartedAt: number | null
  /** Seconds since `jobStartedAt` (ticks every second), or null when idle. */
  elapsedSeconds: number | null
  /** `elapsedSeconds` formatted as `m:ss`, or null when idle. */
  elapsedLabel: string | null
  animError: string | null
  /**
   * True when `animError` means "another job is already running" rather than a
   * real failure — client-side guard or the server's 429 BUSY mapping. Shown
   * as neutral guidance instead of a danger block.
   */
  isBusyError: boolean
  handleGenerateAnimation: () => Promise<void>
  previewRef: string | null
  handlePreviewReference: () => Promise<void>
  result: AnimateResult | null
  handleUseResult: () => Promise<void>
  handleDismissResult: () => void
  recent: readonly RecentAnimationItem[]
  handleApplyRecent: (item: RecentAnimationItem) => Promise<void>
  handleDeleteRecent: (item: RecentAnimationItem) => void
  handleSeeAllAssets: () => void
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/** The preset's default frames if allowed at this size, else the largest allowed count below it. */
const pickFrameCount = (preferred: number, options: readonly number[]): number =>
  options.includes(preferred)
    ? preferred
    : (options.filter((frames) => frames <= preferred).slice(-1)[0] ?? options[0] ?? preferred)

const errorMessage = (error: unknown): string =>
  error instanceof Error && error.message ? error.message : ANIMATION_GENERIC_ERROR

/** Non-null only for a provider-thrown error the port recognizes (e.g. the PixelLab 429 `BUSY` mapping). */
const errorCode = (error: unknown): AnimationErrorCode | null =>
  error instanceof AnimationProviderError ? error.code : null

/** `m:ss`, e.g. 75 -> "1:15". */
const formatElapsedTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / ANIMATION_SECONDS_PER_MINUTE)
  const remainingSeconds = seconds % ANIMATION_SECONDS_PER_MINUTE
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
}

const exportCanvasReference = async (): Promise<string> => {
  const { layersToBase64 } = await import('@/lib/export-utils')
  // Read at call time — subscribing to `layers` would re-render this tab on every stroke.
  const { canvasWidth, canvasHeight, layers } = useSpriteEditorStore.getState()
  return layersToBase64(canvasWidth, canvasHeight, layers)
}

/**
 * Animate tab (ADR 0009). Talks to an `AnimationProvider` (port), never to a
 * vendor: submit returns a job id, then the job is polled until it finishes.
 * The pending job lives in `useAIJobsStore` (sessionStorage), so switching
 * tabs or reloading resumes polling instead of losing a paid generation. One
 * job at a time: the free tier allows a single concurrent job.
 */
export const useAnimateTab = (): UseAnimateTabReturn => {
  const { applyAnimation } = useApplyAsset()
  const canvasSize = useCanvasDimensions()
  const pixelLabApiKey = usePixelLabApiKey()
  const addAnimation = useAssetsStore((s) => s.addAnimation)
  const animations = useAssetsStore((s) => s.animations)
  const removeAnimation = useAssetsStore((s) => s.removeAnimation)
  const setBottomPanelTab = useSetBottomPanelTab()
  const toggleTimeline = useToggleTimeline()
  const timelineOpen = useEditorUIStore((s) => s.ui.timelineOpen)

  // Shared with the Create tab (lifted into the UI store, batch 2) — animating
  // a non-character asset should still animate the type the user already chose.
  const assetType = useCreateAssetType()
  const setCreateAssetType = useSetCreateAssetType()

  const { motions, defaultMotionId } = ANIMATION_HARNESS[assetType]
  const frameOptions = useMemo(() => allowedFrameCounts(canvasSize.width), [canvasSize.width])
  const canvasSizeError = getAnimationSizeError(canvasSize.width, canvasSize.height)

  const [motionId, setMotionIdState] = useState<string>(defaultMotionId)
  const [nFrames, setNFrames] = useState<number>(() =>
    pickFrameCount(findAnimationMotion(assetType, defaultMotionId).defaultFrames, frameOptions),
  )
  const [customText, setCustomText] = useState('')
  const [previewRef, setPreviewRef] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())

  // Request state lives in `useAIJobsStore` so it survives this tab unmounting.
  const isGenerating = useAIJobsStore((s) => s.animate.isRunning)
  const animError = useAIJobsStore((s) => s.animate.error)
  const animErrorCode = useAIJobsStore((s) => s.animate.errorCode)
  const result = useAIJobsStore((s) => s.animate.result)
  const pendingJob = useAIJobsStore((s) => s.animatePending)
  const setAnimateJob = useAIJobsStore((s) => s.setAnimateJob)
  const setAnimatePending = useAIJobsStore((s) => s.setAnimatePending)
  const setResult = useCallback((next: AnimateResult | null) => setAnimateJob({ result: next }), [setAnimateJob])

  const provider = useMemo(
    () => resolveAnimationProvider({ apiKey: pixelLabApiKey ?? undefined }),
    [pixelLabApiKey],
  )

  const motion = findAnimationMotion(assetType, motionId)
  const isCharacter = assetType === 'character'
  const jobStartedAt = pendingJob?.startedAt ?? null

  const setMotionId = useCallback(
    (id: string) => {
      setMotionIdState(id)
      setNFrames(pickFrameCount(findAnimationMotion(assetType, id).defaultFrames, frameOptions))
    },
    [assetType, frameOptions],
  )

  // Changing the type resets to ITS default motion — e.g. a `crouch`
  // selection carried over from `character` has no equivalent in the
  // object/weapon/costume/effect motion list.
  const setAssetType = useCallback(
    (next: AssetType) => {
      const nextDefault = ANIMATION_HARNESS[next].defaultMotionId
      setCreateAssetType(next)
      setMotionIdState(nextDefault)
      setNFrames(pickFrameCount(findAnimationMotion(next, nextDefault).defaultFrames, frameOptions))
      setCustomText('')
    },
    [setCreateAssetType, frameOptions],
  )

  const finishAnimation = useCallback(
    async (pending: PendingAnimationJob, frames: readonly string[]) => {
      // Frames arrive as PNG data URIs at the canvas size — stored as-is.
      const newAnimation: AIAnimation = {
        pipelineVersion: ANIMATION_PIPELINE_VERSION,
        id: crypto.randomUUID(),
        label: pending.label,
        frames,
        frameDurationMs: SPRITE_ANIMATION.DEFAULT_FRAME_DURATION_MS,
        timestamp: Date.now(),
        assetType: pending.assetType,
      }
      addAnimation(newAnimation)

      const canApplyAutomatically = isCanvasBlank(useSpriteEditorStore.getState().timeline.frames)
      if (canApplyAutomatically) {
        await applyAnimation({ frames: newAnimation.frames, frameDurationMs: newAnimation.frameDurationMs })
      }
      setResult({
        frames: newAnimation.frames,
        frameDurationMs: newAnimation.frameDurationMs,
        label: newAnimation.label,
        autoApplied: canApplyAutomatically,
      })
    },
    [addAnimation, applyAnimation, setResult],
  )

  /** Polls until the job completes, fails or times out. Assumes `animate.isRunning` is already true. */
  const pollUntilDone = useCallback(
    async (pending: PendingAnimationJob) => {
      const isStillPending = () => useAIJobsStore.getState().animatePending?.jobId === pending.jobId
      let consecutiveErrors = 0
      try {
        while (isStillPending()) {
          if (Date.now() - pending.startedAt > ANIMATION_POLL_TIMEOUT_MS) throw new Error(ANIMATION_TIMEOUT_ERROR)
          await sleep(ANIMATION_POLL_INTERVAL_MS)

          let job: AnimationJobStatus
          try {
            job = await provider.poll(pending.jobId)
            consecutiveErrors = 0
          } catch (error) {
            // A dropped request must not throw away a paid job — retry a few times first.
            consecutiveErrors += 1
            if (consecutiveErrors >= ANIMATION_POLL_MAX_CONSECUTIVE_ERRORS) throw error
            continue
          }

          if (job.status === 'failed') throw new Error(job.error ?? ANIMATION_GENERIC_ERROR)
          if (job.status === 'completed') {
            await finishAnimation(pending, job.frames)
            return
          }
        }
      } catch (error) {
        setAnimateJob({ error: errorMessage(error), errorCode: errorCode(error) })
      } finally {
        // Pending first: clearing `isRunning` while a job is still pending would
        // make the resume effect below start a second loop.
        if (isStillPending()) setAnimatePending(null)
        setAnimateJob({ isRunning: false })
      }
    },
    [provider, finishAnimation, setAnimateJob, setAnimatePending],
  )

  // Resume: after a reload the pending job is back from sessionStorage but no
  // loop is polling it. `isRunning` is the guard — a live loop always holds it.
  useEffect(() => {
    if (!pendingJob || useAIJobsStore.getState().animate.isRunning) return
    setAnimateJob({ isRunning: true, error: null, errorCode: null })
    void pollUntilDone(pendingJob)
  }, [pendingJob, pollUntilDone, setAnimateJob])

  // Elapsed-time ticker, only while a job runs.
  useEffect(() => {
    if (jobStartedAt === null) return
    setNow(Date.now())
    const timer = setInterval(() => setNow(Date.now()), ANIMATION_ELAPSED_TICK_MS)
    return () => clearInterval(timer)
  }, [jobStartedAt])

  const elapsedSeconds =
    jobStartedAt === null ? null : Math.max(0, Math.floor((now - jobStartedAt) / MS_PER_SECOND))
  const elapsedLabel = elapsedSeconds === null ? null : formatElapsedTime(elapsedSeconds)

  // Two sources end up as `animErrorCode`: the client-side "already running"
  // guard (submit blocked before a request is made) and the server's 429
  // `BUSY` mapping (request made, PixelLab itself was busy). Both read as
  // neutral guidance — derived from the typed code, never from `animError`'s
  // message text, which is free to change.
  const isBusyError = animErrorCode === 'ALREADY_RUNNING' || animErrorCode === 'BUSY'

  const handlePreviewReference = useCallback(async () => {
    setPreviewRef((await exportCanvasReference()) || null)
  }, [])

  const handleGenerateAnimation = useCallback(async () => {
    if (motion.isCustomInput && !customText.trim()) return

    const jobs = useAIJobsStore.getState()
    if (jobs.animatePending || jobs.animate.isRunning) {
      setAnimateJob({ error: ANIMATION_ALREADY_RUNNING_ERROR, errorCode: 'ALREADY_RUNNING' })
      return
    }

    // Fail before paying: size and frame limits are checked client-side too.
    const { canvasWidth, canvasHeight } = useSpriteEditorStore.getState()
    const limitError =
      getAnimationSizeError(canvasWidth, canvasHeight) ?? getAnimationFrameCountError(canvasWidth, nFrames)
    if (limitError) {
      setAnimateJob({ error: limitError, result: null, errorCode: null })
      return
    }

    setAnimateJob({ isRunning: true, error: null, result: null, errorCode: null })
    try {
      const firstFrameBase64 = await exportCanvasReference()
      if (!firstFrameBase64) throw new Error(ANIMATION_REFERENCE_EXPORT_ERROR)

      const { jobId } = await provider.submit({
        firstFrameBase64,
        action: buildAnimationAction(motion.isCustomInput ? customText : motion, assetType),
        frameCount: nFrames,
        enhancePrompt: motion.enhancePrompt,
        driftThreshold: motion.driftThreshold,
      })
      const pending: PendingAnimationJob = { jobId, startedAt: Date.now(), label: motion.label, assetType }
      setAnimatePending(pending)
      await pollUntilDone(pending)
    } catch (error) {
      setAnimateJob({ isRunning: false, error: errorMessage(error), errorCode: errorCode(error) })
    }
  }, [motion, customText, assetType, nFrames, provider, pollUntilDone, setAnimateJob, setAnimatePending])

  const handleUseResult = useCallback(async () => {
    if (!result) return
    await applyAnimation({ frames: result.frames, frameDurationMs: result.frameDurationMs })
    setResult({ ...result, autoApplied: true })
  }, [result, applyAnimation, setResult])

  const handleDismissResult = useCallback(() => setResult(null), [setResult])

  const recent = useMemo<RecentAnimationItem[]>(
    () =>
      animations.slice(0, RECENT_ASSETS_LIMIT).map((animation) => ({
        id: animation.id,
        title: animation.label,
        thumbnailSrc: animation.frames[0] ?? '',
        frames: animation.frames,
        frameDurationMs: animation.frameDurationMs,
      })),
    [animations],
  )

  const handleApplyRecent = useCallback(
    (item: RecentAnimationItem) => applyAnimation({ frames: item.frames, frameDurationMs: item.frameDurationMs }),
    [applyAnimation],
  )

  const handleDeleteRecent = useCallback((item: RecentAnimationItem) => removeAnimation(item.id), [removeAnimation])

  const handleSeeAllAssets = useCallback(() => {
    setBottomPanelTab('assets')
    if (!timelineOpen) toggleTimeline()
  }, [setBottomPanelTab, timelineOpen, toggleTimeline])

  return {
    assetType,
    setAssetType,
    motions,
    motionId: motion.id,
    setMotionId,
    motion,
    isCharacter,
    nFrames,
    setNFrames,
    frameOptions,
    customText,
    setCustomText,
    canvasSize,
    canvasSizeError,
    isGenerating,
    jobStartedAt,
    elapsedSeconds,
    elapsedLabel,
    animError,
    isBusyError,
    handleGenerateAnimation,
    previewRef,
    handlePreviewReference,
    result,
    handleUseResult,
    handleDismissResult,
    recent,
    handleApplyRecent,
    handleDeleteRecent,
    handleSeeAllAssets,
  }
}
