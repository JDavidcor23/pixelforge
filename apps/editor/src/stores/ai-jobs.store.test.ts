import { beforeEach, describe, expect, it } from 'vitest'

import { useAIJobsStore } from './ai-jobs.store'

const IDLE = { isRunning: false, error: null, result: null }

describe('useAIJobsStore', () => {
  beforeEach(() => {
    useAIJobsStore.setState({ generate: IDLE, animate: IDLE, generatePrompt: '' })
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
})
