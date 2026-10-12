import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { AI_JOBS_STORAGE_KEY } from '@/constants/persistence'
import type { AIJob, AnimateJob, GenerateResult, PendingAnimationJob } from '@/types'

/**
 * UI state of the sprite AI requests (Create > Generate, Animate). A request
 * keeps running when its tab unmounts — the user switches to Animate or to the
 * sound editor — so its spinner, result card and error must outlive the tab.
 * The hooks write here instead of `useState`; remounting reads it back.
 *
 * Everything is session-only EXCEPT `animatePending`: a PixelLab animation is a
 * background job that keeps running — and is billed — after a reload, so its
 * id is kept in sessionStorage and the Animate tab resumes polling it
 * (ADR 0009). Finished results are already saved in the Assets library.
 */
export interface AIJobsState {
  readonly generate: AIJob<GenerateResult>
  readonly animate: AnimateJob
  /** The Animate job being polled, or null. Its presence is the one-job-at-a-time lock. */
  readonly animatePending: PendingAnimationJob | null
  /** Create > Generate prompt draft, kept across tab switches. */
  readonly generatePrompt: string
  readonly lastCostUsd: number | null
  readonly remainingBalanceUsd: number | null
  setGenerateJob: (patch: Partial<AIJob<GenerateResult>>) => void
  setAnimateJob: (patch: Partial<AnimateJob>) => void
  setAnimatePending: (pending: PendingAnimationJob | null) => void
  setGeneratePrompt: (prompt: string) => void
  setBalance: (costUsd: number, remainingBalanceUsd: number) => void
}

const IDLE_JOB = { isRunning: false, error: null, result: null } as const
const IDLE_ANIMATE_JOB: AnimateJob = { isRunning: false, error: null, result: null, errorCode: null }

export const useAIJobsStore = create<AIJobsState>()(
  persist(
    (set) => ({
      generate: IDLE_JOB,
      animate: IDLE_ANIMATE_JOB,
      animatePending: null,
      generatePrompt: '',
      lastCostUsd: null,
      remainingBalanceUsd: null,
      setGenerateJob: (patch) => set((state) => ({ generate: { ...state.generate, ...patch } })),
      setAnimateJob: (patch) => set((state) => ({ animate: { ...state.animate, ...patch } })),
      setAnimatePending: (animatePending) => set({ animatePending }),
      setGeneratePrompt: (generatePrompt) => set({ generatePrompt }),
      setBalance: (lastCostUsd, remainingBalanceUsd) => set({ lastCostUsd, remainingBalanceUsd }),
    }),
    {
      name: AI_JOBS_STORAGE_KEY,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ animatePending: state.animatePending }),
    },
  ),
)
