import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAIJobsStore } from './ai-jobs.store'
import { AI_JOBS_STORAGE_KEY } from '@/constants/persistence'

// The store persists its pending Animate job to sessionStorage; vitest runs in
// node, so give it one before the store module is evaluated.
const storage = vi.hoisted(() => {
  const data = new Map<string, string>()
  const memory = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  }
  globalThis.sessionStorage = memory as unknown as Storage
  return data
})

const IDLE = { isRunning: false, error: null, result: null }
const IDLE_ANIMATE = { ...IDLE, errorCode: null, stall: null, progress: null }
const PENDING = { jobId: 'job-1', startedAt: 1, label: 'Walk', assetType: 'character' as const }
const PROCESSING = { state: 'processing' as const, queuePosition: 2, estimatedWaitSeconds: 60 }

const REFERENCE = {
  source: { kind: 'canvas' as const, frameIndex: 0 },
  imageBase64: 'data:image/png;base64,REF',
  label: 'Frame 1',
}

describe('useAIJobsStore', () => {
  beforeEach(() => {
    useAIJobsStore.setState({
      generate: IDLE,
      animate: IDLE_ANIMATE,
      animatePending: null,
      generatePrompt: '',
      animationReference: null,
    })
  })

  // A PixelLab job keeps running (and is billed) after a reload, so only its
  // id is persisted — the spinner/result state is not.
  it('persists only the pending animate job and the locked reference', () => {
    const pending = { jobId: 'job-1', startedAt: 1, label: 'Walk', assetType: 'character' as const }
    useAIJobsStore.getState().setAnimatePending(pending)
    useAIJobsStore.getState().setAnimateJob({ isRunning: true })

    const saved = JSON.parse(storage.get(AI_JOBS_STORAGE_KEY) ?? '{}') as { state: Record<string, unknown> }
    expect(saved.state).toEqual({ animatePending: pending, animationReference: null })
  })

  // ADR 0011: the locked reference survives a reload like `animatePending`
  // already does, so a mid-session refresh doesn't silently unlock it.
  describe('animation reference lock', () => {
    it('starts unlocked', () => {
      expect(useAIJobsStore.getState().animationReference).toBeNull()
    })

    it('locks a reference and persists it to sessionStorage', () => {
      useAIJobsStore.getState().setAnimationReference(REFERENCE)

      expect(useAIJobsStore.getState().animationReference).toEqual(REFERENCE)
      const saved = JSON.parse(storage.get(AI_JOBS_STORAGE_KEY) ?? '{}') as { state: Record<string, unknown> }
      expect(saved.state).toEqual({ animatePending: null, animationReference: REFERENCE })
    })

    it('replaces the locked reference when the user picks a different one', () => {
      useAIJobsStore.getState().setAnimationReference(REFERENCE)
      const next = { ...REFERENCE, source: { kind: 'asset' as const, assetId: 'asset-1' }, label: 'Wizard idle' }

      useAIJobsStore.getState().setAnimationReference(next)

      expect(useAIJobsStore.getState().animationReference).toEqual(next)
    })
  })

  // The tab that started the request may be unmounted when it resolves; the
  // result has to land in the store so the remounted tab shows it.
  it('keeps a generate result written after the request resolves', () => {
    const { setGenerateJob } = useAIJobsStore.getState()
    setGenerateJob({ isRunning: true, error: null, result: null })

    setGenerateJob({ result: { base64: 'data:image/png;base64,x', width: 64, prompt: 'a dragon', autoApplied: false } })
    setGenerateJob({ isRunning: false })

    const { generate } = useAIJobsStore.getState()
    expect(generate.isRunning).toBe(false)
    expect(generate.result?.prompt).toBe('a dragon')
  })

  it('patches one job without touching the other', () => {
    useAIJobsStore.getState().setAnimateJob({ isRunning: true })

    expect(useAIJobsStore.getState().animate.isRunning).toBe(true)
    expect(useAIJobsStore.getState().generate).toEqual(IDLE)
  })

  // ADR 0009: `isBusyError` is derived from this typed code, never from
  // comparing `animate.error`'s message text.
  it('keeps a typed errorCode alongside the error message', () => {
    useAIJobsStore.getState().setAnimateJob({ error: 'PixelLab is busy', errorCode: 'BUSY' })

    expect(useAIJobsStore.getState().animate.errorCode).toBe('BUSY')

    useAIJobsStore.getState().setAnimateJob({ isRunning: true, error: null, errorCode: null })
    expect(useAIJobsStore.getState().animate.errorCode).toBeNull()
  })

  // Regression: a 5-min client timeout used to clear `animatePending`, losing a
  // PAID job that finished later on PixelLab.
  describe('kept animate job lifecycle', () => {
    beforeEach(() => {
      useAIJobsStore.getState().setAnimatePending(PENDING)
      useAIJobsStore.getState().setAnimateJob({ isRunning: true, progress: PROCESSING })
    })

    it('a timeout stalls polling but keeps the pending job (and its persisted id)', () => {
      useAIJobsStore.getState().stallAnimate('timeout')

      const state = useAIJobsStore.getState()
      expect(state.animatePending).toEqual(PENDING)
      expect(state.animate.isRunning).toBe(false)
      expect(state.animate.stall).toBe('timeout')
      const saved = JSON.parse(storage.get(AI_JOBS_STORAGE_KEY) ?? '{}') as { state: Record<string, unknown> }
      expect(saved.state).toEqual({ animatePending: PENDING, animationReference: null })
    })

    it('a network stall keeps the pending job too', () => {
      useAIJobsStore.getState().stallAnimate('network')

      expect(useAIJobsStore.getState().animatePending).toEqual(PENDING)
      expect(useAIJobsStore.getState().animate.stall).toBe('network')
    })

    it('check again re-claims the kept job for a new polling loop', () => {
      useAIJobsStore.getState().stallAnimate('timeout')

      expect(useAIJobsStore.getState().resumeAnimate()).toEqual(PENDING)
      expect(useAIJobsStore.getState().animate.isRunning).toBe(true)
      expect(useAIJobsStore.getState().animate.stall).toBeNull()
    })

    it('refuses to resume while a loop already holds the job (no double polling)', () => {
      expect(useAIJobsStore.getState().resumeAnimate()).toBeNull()
    })

    it('refuses to resume when nothing is pending', () => {
      useAIJobsStore.getState().discardAnimatePending()
      expect(useAIJobsStore.getState().resumeAnimate()).toBeNull()
    })

    it('discard clears the pending job and the stalled state', () => {
      useAIJobsStore.getState().stallAnimate('timeout')
      useAIJobsStore.getState().discardAnimatePending()

      const state = useAIJobsStore.getState()
      expect(state.animatePending).toBeNull()
      expect(state.animate).toEqual(IDLE_ANIMATE)
    })

    it('a completed job clears the pending job and releases the loop in one update', () => {
      useAIJobsStore.getState().settleAnimate()

      const state = useAIJobsStore.getState()
      expect(state.animatePending).toBeNull()
      expect(state.animate.isRunning).toBe(false)
      expect(state.animate.progress).toBeNull()
    })

    it('a failed job clears the pending job and keeps the error', () => {
      useAIJobsStore.getState().settleAnimate({ error: 'NSFW', errorCode: null })

      const state = useAIJobsStore.getState()
      expect(state.animatePending).toBeNull()
      expect(state.animate.error).toBe('NSFW')
      expect(state.animate.isRunning).toBe(false)
    })
  })
})
