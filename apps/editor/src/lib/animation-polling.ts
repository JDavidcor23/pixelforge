import {
  ANIMATION_HINT_SEPARATOR,
  ANIMATION_QUEUE_POSITION_PREFIX,
  ANIMATION_SECONDS_PER_MINUTE,
  ANIMATION_WAIT_PREFIX,
  ANIMATION_WAIT_SUFFIX,
} from '@/constants/animation'
import type {
  AnimationJobProgress,
  AnimationJobStatus,
  AnimationPollOutcome,
} from '@/types'

/** Everything the loop touches is injected, so it is testable without timers, React or a network. */
export interface AnimationPollDeps {
  readonly poll: (jobId: string) => Promise<AnimationJobStatus>
  /** False once the job left `animatePending` (completed elsewhere or discarded) — the loop then stops. */
  readonly isStillPending: () => boolean
  /** Called with every non-terminal status, so the UI can show PixelLab's real state. */
  readonly onProgress: (progress: AnimationJobProgress) => void
  readonly sleep: (ms: number) => Promise<void>
  readonly now: () => number
  readonly intervalMs: number
  /** Length of THIS polling window, counted from the call — never from the job's submit time. */
  readonly timeoutMs: number
  readonly maxConsecutiveErrors: number
}

/** Running status → the progress the store keeps. Absent provider fields become null. */
export const toAnimationProgress = (job: AnimationJobStatus): AnimationJobProgress | null =>
  job.status === 'queued' || job.status === 'processing'
    ? {
        state: job.status,
        queuePosition: job.queuePosition ?? null,
        estimatedWaitSeconds: job.estimatedWaitSeconds ?? null,
      }
    : null

/**
 * Polls one pending job until it is terminal, paused or abandoned (ADR 0009).
 * Neither the window running out nor a run of failed status reads drops the
 * job: both answer `stalled`, and the caller keeps the job id so a paid
 * generation that finishes later can still be collected.
 */
export const pollAnimationJob = async (jobId: string, deps: AnimationPollDeps): Promise<AnimationPollOutcome> => {
  const deadline = deps.now() + deps.timeoutMs
  let consecutiveErrors = 0

  while (deps.isStillPending()) {
    if (deps.now() > deadline) return { kind: 'stalled', reason: 'timeout' }
    await deps.sleep(deps.intervalMs)
    if (!deps.isStillPending()) break

    let job: AnimationJobStatus
    try {
      job = await deps.poll(jobId)
      consecutiveErrors = 0
    } catch {
      consecutiveErrors += 1
      if (consecutiveErrors >= deps.maxConsecutiveErrors) return { kind: 'stalled', reason: 'network' }
      continue
    }

    if (job.status === 'failed') return { kind: 'failed', error: job.error }
    if (job.status === 'completed') return { kind: 'completed', frames: job.frames }
    const progress = toAnimationProgress(job)
    if (progress) deps.onProgress(progress)
  }

  return { kind: 'abandoned' }
}

/** "In queue: #3 · ~2 min left", either part alone, or null when PixelLab sent neither. */
export const formatAnimationProgressHint = (progress: AnimationJobProgress | null): string | null => {
  if (!progress) return null
  const parts: string[] = []
  if (progress.queuePosition !== null && progress.queuePosition > 0) {
    parts.push(`${ANIMATION_QUEUE_POSITION_PREFIX}${progress.queuePosition}`)
  }
  if (progress.estimatedWaitSeconds !== null && progress.estimatedWaitSeconds > 0) {
    const minutes = Math.ceil(progress.estimatedWaitSeconds / ANIMATION_SECONDS_PER_MINUTE)
    parts.push(`${ANIMATION_WAIT_PREFIX}${minutes}${ANIMATION_WAIT_SUFFIX}`)
  }
  return parts.length > 0 ? parts.join(ANIMATION_HINT_SEPARATOR) : null
}
