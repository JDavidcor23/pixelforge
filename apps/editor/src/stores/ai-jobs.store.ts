import { create } from 'zustand'

import type { AIJob, AnimateResult, GenerateResult } from '@/types'

/**
 * UI state of the sprite AI requests (Create > Generate, Animate). A request
 * keeps running when its tab unmounts — the user switches to Animate or to the
 * sound editor — so its spinner, result card and error must outlive the tab.
 * The hooks write here instead of `useState`; remounting reads it back.
 * Session-only on purpose: a reload cancels in-flight requests anyway, and
 * finished results are already saved in the Assets library.
 */
export interface AIJobsState {
  readonly generate: AIJob<GenerateResult>
  readonly animate: AIJob<AnimateResult>
  /** Create > Generate prompt draft, kept across tab switches. */
  readonly generatePrompt: string
  readonly lastCostUsd: number | null
  readonly remainingBalanceUsd: number | null
  setGenerateJob: (patch: Partial<AIJob<GenerateResult>>) => void
  setAnimateJob: (patch: Partial<AIJob<AnimateResult>>) => void
  setGeneratePrompt: (prompt: string) => void
  setBalance: (costUsd: number, remainingBalanceUsd: number) => void
}

const IDLE_JOB = { isRunning: false, error: null, result: null } as const

export const useAIJobsStore = create<AIJobsState>((set) => ({
  generate: IDLE_JOB,
  animate: IDLE_JOB,
  generatePrompt: '',
  lastCostUsd: null,
  remainingBalanceUsd: null,
  setGenerateJob: (patch) => set((state) => ({ generate: { ...state.generate, ...patch } })),
  setAnimateJob: (patch) => set((state) => ({ animate: { ...state.animate, ...patch } })),
  setGeneratePrompt: (generatePrompt) => set({ generatePrompt }),
  setBalance: (lastCostUsd, remainingBalanceUsd) => set({ lastCostUsd, remainingBalanceUsd }),
}))
