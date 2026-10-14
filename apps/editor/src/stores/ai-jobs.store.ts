import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { AI_JOBS_STORAGE_KEY } from '@/constants/persistence'
import type { AIJob, AnimateJob, AnimationReference, AnimationStallReason, GenerateResult, PendingAnimationJob } from '@/types'

/**
 * UI state of the sprite AI requests (Create > Generate, Animate). A request
 * keeps running when its tab unmounts — the user switches to Animate or to the
 * sound editor — so its spinner, result card and error must outlive the tab.
 * The hooks write here instead of `useState`; remounting reads it back.
 *
 * Everything is session-only EXCEPT `animatePending` and `animationReference`:
 * a PixelLab animation is a background job that keeps running — and is billed
 * — after a reload, so its id is kept in sessionStorage and the Animate tab
 * resumes polling it (ADR 0009). Finished results are already saved in the
 * Assets library. `animationReference` (ADR 0011) is the user's explicitly
 * locked reference image for the session — it survives a reload the same way,
 * so a mid-session refresh never silently falls back to the live canvas.
 *
 * `animatePending` is cleared ONLY by `settleAnimate` (the job reached a
 * terminal state) or `discardAnimatePending` (the user chose to). A client
 * timeout or a network hiccup pauses polling via `stallAnimate` and keeps it.
 */
export interface AIJobsState {
  readonly generate: AIJob<GenerateResult>
  readonly animate: AnimateJob
  /** The Animate job being polled, or null. Its presence is the one-job-at-a-time lock. */
  readonly animatePending: PendingAnimationJob | null
  /**
   * The Animate tab's locked reference (ADR 0011), or null until the user
   * picks one. Persisted like `animatePending` — a mid-session reload must
   * not silently unlock it and fall back to the live canvas.
   */
  readonly animationReference: AnimationReference | null
  /** Create > Generate prompt draft, kept across tab switches. */
  readonly generatePrompt: string
  readonly lastCostUsd: number | null
  readonly remainingBalanceUsd: number | null
  setGenerateJob: (patch: Partial<AIJob<GenerateResult>>) => void
  setAnimateJob: (patch: Partial<AnimateJob>) => void
  setAnimatePending: (pending: PendingAnimationJob | null) => void
  /** Locks (or replaces) the session's Animate reference — only the picker calls this. */
  setAnimationReference: (reference: AnimationReference | null) => void
  /** Stops the polling loop's claim (`isRunning: false`) but KEEPS `animatePending`. */
  stallAnimate: (reason: AnimationStallReason) => void
  /**
   * Claims the kept job for a new polling loop and returns it, or null when
   * there is nothing to resume or a loop already holds it.
   */
  resumeAnimate: () => PendingAnimationJob | null
  /** The job reached a terminal state: releases the lock and the loop in one update. */
  settleAnimate: (patch?: Partial<Pick<AnimateJob, 'error' | 'errorCode'>>) => void
  /** The user gave up on the kept job. It may still finish — and be billed — upstream. */
  discardAnimatePending: () => void
  setGeneratePrompt: (prompt: string) => void
  setBalance: (costUsd: number, remainingBalanceUsd: number) => void
}

const IDLE_JOB = { isRunning: false, error: null, result: null } as const
const IDLE_ANIMATE_JOB: AnimateJob = {
  isRunning: false,
  error: null,
  result: null,
  errorCode: null,
  stall: null,
  progress: null,
}

export const useAIJobsStore = create<AIJobsState>()(
  persist(
    (set, get) => ({
      generate: IDLE_JOB,
      animate: IDLE_ANIMATE_JOB,
      animatePending: null,
      animationReference: null,
      generatePrompt: '',
      lastCostUsd: null,
      remainingBalanceUsd: null,
      setGenerateJob: (patch) => set((state) => ({ generate: { ...state.generate, ...patch } })),
      setAnimateJob: (patch) => set((state) => ({ animate: { ...state.animate, ...patch } })),
      setAnimatePending: (animatePending) => set({ animatePending }),
      setAnimationReference: (animationReference) => set({ animationReference }),
      stallAnimate: (stall) =>
        set((state) => ({ animate: { ...state.animate, isRunning: false, stall, error: null, errorCode: null } })),
      resumeAnimate: () => {
        const { animatePending, animate } = get()
        if (!animatePending || animate.isRunning) return null
        set({ animate: { ...animate, isRunning: true, stall: null, error: null, errorCode: null } })
        return animatePending
      },
      settleAnimate: (patch) =>
        set((state) => ({
          animatePending: null,
          animate: { ...state.animate, ...patch, isRunning: false, stall: null, progress: null },
        })),
      discardAnimatePending: () =>
        set((state) => ({
          animatePending: null,
          animate: { ...state.animate, isRunning: false, stall: null, progress: null, error: null, errorCode: null },
        })),
      setGeneratePrompt: (generatePrompt) => set({ generatePrompt }),
      setBalance: (lastCostUsd, remainingBalanceUsd) => set({ lastCostUsd, remainingBalanceUsd }),
    }),
    {
      name: AI_JOBS_STORAGE_KEY,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ animatePending: state.animatePending, animationReference: state.animationReference }),
    },
  ),
)
