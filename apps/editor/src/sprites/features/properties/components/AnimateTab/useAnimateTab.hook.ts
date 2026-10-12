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
import { useAnimationJobLedgerStore } from '@/stores/animation-job-ledger.store'
import { useFinishAnimation } from './useFinishAnimation.hook'
import { ANIMATION_HARNESS, buildAnimationAction, findAnimationMotion } from '@/lib/animation-harness'
import { findLedgerEntry, isLedgerEntrySaved } from '@/lib/animation-job-ledger'
import { allowedFrameCounts, getAnimationFrameCountError, getAnimationSizeError } from '@/lib/animation-limits'
import { formatAnimationProgressHint, pollAnimationJob } from '@/lib/animation-polling'
import { AnimationProviderError, resolveAnimationProvider } from '@/services/animation-provider.service'
import { MS_PER_SECOND, RECENT_ASSETS_LIMIT } from '@/constants'
import {
  ANIMATION_ALREADY_RUNNING_ERROR,
  ANIMATION_ELAPSED_TICK_MS,
  ANIMATION_GENERATING_HINT,
  ANIMATION_GENERATING_LABEL,
  ANIMATION_GENERIC_ERROR,
  ANIMATION_POLL_INTERVAL_MS,
  ANIMATION_POLL_MAX_CONSECUTIVE_ERRORS,
  ANIMATION_POLL_TIMEOUT_MS,
  ANIMATION_QUEUED_LABEL,
  ANIMATION_REFERENCE_EXPORT_ERROR,
  ANIMATION_SECONDS_PER_MINUTE,
  ANIMATION_STALLED_MESSAGE,
  ANIMATION_STALLED_NETWORK_MESSAGE,
} from '@/constants/animation'
import type {
  AnimateResult,
  AnimationActiveJobState,
  AnimationErrorCode,
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
  /** PixelLab's state from the last poll, or null before the first one / when idle. */
  jobState: AnimationActiveJobState | null
  /** Generate button text while a job runs: queued vs generating. */
  runningLabel: string
  /** Queue position / wait estimate when PixelLab sends them, else the generic hint. */
  progressHint: string
  /**
   * Polling paused on a job that is still kept (client timeout or network).
   * New submits stay blocked until `handleCheckAgain` or `handleDiscardJob`.
   */
  isStalled: boolean
  stalledMessage: string | null
  /** Resumes polling the kept job with a fresh window. */
  handleCheckAgain: () => void
  /** Forgets the kept job. It may still finish — and be billed — on PixelLab. */
  handleDiscardJob: () => void
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
 * tabs or reloading resumes polling instead of losing a paid generation. Every
 * job id is ALSO written to the durable ledger (`useAnimationJobLedgerStore`,
 * localStorage) right after submit, so it survives a tab close and can be
 * recovered from "Unfinished jobs". One job at a time: the free tier allows a
 * single concurrent job.
 */
export const useAnimateTab = (): UseAnimateTabReturn => {
  const { applyAnimation } = useApplyAsset()
  const canvasSize = useCanvasDimensions()
  const pixelLabApiKey = usePixelLabApiKey()
  const presentAnimation = useFinishAnimation()
  const recordLedgerEntry = useAnimationJobLedgerStore((s) => s.record)
  const updateLedger = useAnimationJobLedgerStore((s) => s.update)
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
  const stall = useAIJobsStore((s) => s.animate.stall)
  const progress = useAIJobsStore((s) => s.animate.progress)
  const pendingJob = useAIJobsStore((s) => s.animatePending)
  const setAnimateJob = useAIJobsStore((s) => s.setAnimateJob)
  const setAnimatePending = useAIJobsStore((s) => s.setAnimatePending)
  const stallAnimate = useAIJobsStore((s) => s.stallAnimate)
  const resumeAnimate = useAIJobsStore((s) => s.resumeAnimate)
  const settleAnimate = useAIJobsStore((s) => s.settleAnimate)
  const discardAnimatePending = useAIJobsStore((s) => s.discardAnimatePending)
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
      // A Recover may already have saved this job — never add it to Assets twice.
      if (isLedgerEntrySaved(findLedgerEntry(useAnimationJobLedgerStore.getState().entries, pending.jobId))) return
      await presentAnimation(pending, frames, (animationId) =>
        updateLedger(pending.jobId, { status: 'completed', animationId, error: null }),
      )
    },
    [presentAnimation, updateLedger],
  )

  /**
   * One polling window for a kept job. Assumes the caller already claimed it
   * (`animate.isRunning` true). Only a terminal state clears `animatePending`;
   * a timeout or a run of network errors stalls instead, so the paid job can
   * still be collected with "Check again".
   */
  const pollUntilDone = useCallback(
    async (pending: PendingAnimationJob) => {
      const isStillPending = () => useAIJobsStore.getState().animatePending?.jobId === pending.jobId
      try {
        const outcome = await pollAnimationJob(pending.jobId, {
          poll: provider.poll,
          isStillPending,
          onProgress: (progress) => setAnimateJob({ progress }),
          sleep,
          now: Date.now,
          intervalMs: ANIMATION_POLL_INTERVAL_MS,
          timeoutMs: ANIMATION_POLL_TIMEOUT_MS,
          maxConsecutiveErrors: ANIMATION_POLL_MAX_CONSECUTIVE_ERRORS,
        })

        switch (outcome.kind) {
          case 'completed':
            await finishAnimation(pending, outcome.frames)
            settleAnimate()
            return
          case 'failed': {
            const error = outcome.error ?? ANIMATION_GENERIC_ERROR
            updateLedger(pending.jobId, { status: 'failed', error })
            settleAnimate({ error, errorCode: null })
            return
          }
          case 'stalled':
            stallAnimate(outcome.reason)
            return
          case 'abandoned':
            // Discarded mid-sleep: `discardAnimatePending` already released the loop.
            if (!useAIJobsStore.getState().animatePending) setAnimateJob({ isRunning: false, progress: null })
            return
        }
      } catch (error) {
        // Frames arrived but saving/applying them threw — the job itself is done upstream.
        settleAnimate({ error: errorMessage(error), errorCode: errorCode(error) })
      }
    },
    [provider, finishAnimation, setAnimateJob, settleAnimate, stallAnimate, updateLedger],
  )

  // Resume: after a reload the pending job is back from sessionStorage but no
  // loop is polling it. `resumeAnimate` refuses while a loop holds the job, and
  // a stalled job waits for "Check again" instead of polling on its own.
  useEffect(() => {
    if (!pendingJob || useAIJobsStore.getState().animate.stall) return
    const resumed = resumeAnimate()
    if (resumed) void pollUntilDone(resumed)
  }, [pendingJob, pollUntilDone, resumeAnimate])

  // Elapsed-time ticker, only while a loop is actually polling.
  useEffect(() => {
    if (jobStartedAt === null || !isGenerating) return
    setNow(Date.now())
    const timer = setInterval(() => setNow(Date.now()), ANIMATION_ELAPSED_TICK_MS)
    return () => clearInterval(timer)
  }, [jobStartedAt, isGenerating])

  const handleCheckAgain = useCallback(() => {
    const resumed = resumeAnimate()
    if (resumed) void pollUntilDone(resumed)
  }, [resumeAnimate, pollUntilDone])

  // Discard keeps the ledger entry (`discarded`, not deleted): the paid job can still be recovered later.
  const handleDiscardJob = useCallback(() => {
    const discarded = useAIJobsStore.getState().animatePending
    if (discarded) updateLedger(discarded.jobId, { status: 'discarded' })
    discardAnimatePending()
  }, [discardAnimatePending, updateLedger])

  const isStalled = stall !== null
  const stalledMessage =
    stall === 'network' ? ANIMATION_STALLED_NETWORK_MESSAGE : stall === 'timeout' ? ANIMATION_STALLED_MESSAGE : null
  const jobState = progress?.state ?? null
  const runningLabel = jobState === 'queued' ? ANIMATION_QUEUED_LABEL : ANIMATION_GENERATING_LABEL
  const progressHint = formatAnimationProgressHint(progress) ?? ANIMATION_GENERATING_HINT

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

    // A stalled job is still pending, so this also blocks a second (paid) submit
    // until the user checks again or discards it — and avoids PixelLab's 429.
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

    setAnimateJob({ isRunning: true, error: null, result: null, errorCode: null, stall: null, progress: null })
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
      // Durable FIRST (localStorage, synchronous): the paid job id must outlive a tab close before any poll.
      recordLedgerEntry({
        jobId,
        submittedAt: pending.startedAt,
        label: pending.label,
        assetType,
        frameCount: nFrames,
        canvasSize: { width: canvasWidth, height: canvasHeight },
      })
      setAnimatePending(pending)
      await pollUntilDone(pending)
    } catch (error) {
      setAnimateJob({ isRunning: false, error: errorMessage(error), errorCode: errorCode(error) })
    }
  }, [
    motion,
    customText,
    assetType,
    nFrames,
    provider,
    pollUntilDone,
    setAnimateJob,
    setAnimatePending,
    recordLedgerEntry,
  ])

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
    jobState,
    runningLabel,
    progressHint,
    isStalled,
    stalledMessage,
    handleCheckAgain,
    handleDiscardJob,
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
