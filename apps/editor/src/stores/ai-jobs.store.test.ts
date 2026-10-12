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
const IDLE_ANIMATE = { ...IDLE, errorCode: null }

describe('useAIJobsStore', () => {
  beforeEach(() => {
    useAIJobsStore.setState({ generate: IDLE, animate: IDLE_ANIMATE, animatePending: null, generatePrompt: '' })
  })

  // A PixelLab job keeps running (and is billed) after a reload, so only its
  // id is persisted — the spinner/result state is not.
  it('persists only the pending animate job', () => {
    const pending = { jobId: 'job-1', startedAt: 1, label: 'Walk', assetType: 'character' as const }
    useAIJobsStore.getState().setAnimatePending(pending)
    useAIJobsStore.getState().setAnimateJob({ isRunning: true })

    const saved = JSON.parse(storage.get(AI_JOBS_STORAGE_KEY) ?? '{}') as { state: Record<string, unknown> }
    expect(saved.state).toEqual({ animatePending: pending })
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
})
