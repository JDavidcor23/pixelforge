import { describe, expect, it, vi } from 'vitest'

import { formatAnimationProgressHint, pollAnimationJob } from './animation-polling'
import type { AnimationPollDeps } from './animation-polling'
import type { AnimationJobStatus } from '@/types'

const INTERVAL_MS = 3000
const TIMEOUT_MS = 9000

const running = (status: 'queued' | 'processing', extra: Partial<AnimationJobStatus> = {}): AnimationJobStatus => ({
  status,
  frames: [],
  error: null,
  costUsd: null,
  ...extra,
})

/** A fake clock: every `sleep` advances `now`, so timeouts need no real timers. */
const makeDeps = (poll: AnimationPollDeps['poll'], overrides: Partial<AnimationPollDeps> = {}): AnimationPollDeps => {
  let clock = 0
  return {
    poll,
    isStillPending: () => true,
    onProgress: vi.fn(),
    sleep: async (ms) => {
      clock += ms
    },
    now: () => clock,
    intervalMs: INTERVAL_MS,
    timeoutMs: TIMEOUT_MS,
    maxConsecutiveErrors: 3,
    ...overrides,
  }
}

describe('pollAnimationJob', () => {
  it('returns the frames when the job completes and reports progress on the way', async () => {
    const poll = vi
      .fn<AnimationPollDeps['poll']>()
      .mockResolvedValueOnce(running('queued', { queuePosition: 2 }))
      .mockResolvedValueOnce({ status: 'completed', frames: ['f1'], error: null, costUsd: 0.02 })
    const deps = makeDeps(poll)

    await expect(pollAnimationJob('job-1', deps)).resolves.toEqual({ kind: 'completed', frames: ['f1'] })
    expect(deps.onProgress).toHaveBeenCalledWith({ state: 'queued', queuePosition: 2, estimatedWaitSeconds: null })
  })

  it('returns the upstream error when the job fails', async () => {
    const poll = vi.fn<AnimationPollDeps['poll']>().mockResolvedValue({
      status: 'failed',
      frames: [],
      error: 'NSFW',
      costUsd: null,
    })

    await expect(pollAnimationJob('job-1', makeDeps(poll))).resolves.toEqual({ kind: 'failed', error: 'NSFW' })
  })

  // Regression: the timeout used to throw and the caller dropped the paid job.
  it('stalls (job kept) when the window runs out, instead of failing', async () => {
    const poll = vi.fn<AnimationPollDeps['poll']>().mockResolvedValue(running('processing'))

    await expect(pollAnimationJob('job-1', makeDeps(poll))).resolves.toEqual({ kind: 'stalled', reason: 'timeout' })
    expect(poll).toHaveBeenCalledTimes(TIMEOUT_MS / INTERVAL_MS + 1)
  })

  it('measures the window from the call, so check-again gets a fresh one', async () => {
    let clock = 1_000_000
    const poll = vi
      .fn<AnimationPollDeps['poll']>()
      .mockResolvedValueOnce(running('processing'))
      .mockResolvedValueOnce({ status: 'completed', frames: ['f1'], error: null, costUsd: null })
    const deps = makeDeps(poll, {
      now: () => clock,
      sleep: async (ms) => {
        clock += ms
      },
    })

    await expect(pollAnimationJob('job-1', deps)).resolves.toEqual({ kind: 'completed', frames: ['f1'] })
  })

  it('stalls (job kept) after too many network errors in a row', async () => {
    const poll = vi.fn<AnimationPollDeps['poll']>().mockRejectedValue(new Error('offline'))

    await expect(pollAnimationJob('job-1', makeDeps(poll))).resolves.toEqual({ kind: 'stalled', reason: 'network' })
    expect(poll).toHaveBeenCalledTimes(3)
  })

  it('a successful read resets the network error count', async () => {
    const poll = vi
      .fn<AnimationPollDeps['poll']>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(running('processing'))
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ status: 'completed', frames: ['f1'], error: null, costUsd: null })
    const deps = makeDeps(poll, { timeoutMs: INTERVAL_MS * 10 })

    await expect(pollAnimationJob('job-1', deps)).resolves.toEqual({ kind: 'completed', frames: ['f1'] })
  })

  it('stops without polling again once the job was discarded', async () => {
    const poll = vi.fn<AnimationPollDeps['poll']>()
    let pending = true
    const deps = makeDeps(poll, {
      isStillPending: () => pending,
      sleep: async () => {
        pending = false
      },
    })

    await expect(pollAnimationJob('job-1', deps)).resolves.toEqual({ kind: 'abandoned' })
    expect(poll).not.toHaveBeenCalled()
  })
})

describe('formatAnimationProgressHint', () => {
  it('shows queue position and wait estimate when PixelLab sends them', () => {
    expect(formatAnimationProgressHint({ state: 'queued', queuePosition: 3, estimatedWaitSeconds: 95 })).toBe(
      'In queue: #3 · ~2 min left',
    )
    expect(formatAnimationProgressHint({ state: 'processing', queuePosition: null, estimatedWaitSeconds: 30 })).toBe(
      '~1 min left',
    )
  })

  it('returns null without usable info, so the caller falls back to the generic hint', () => {
    expect(formatAnimationProgressHint(null)).toBeNull()
    expect(formatAnimationProgressHint({ state: 'processing', queuePosition: 0, estimatedWaitSeconds: null })).toBeNull()
  })
})
