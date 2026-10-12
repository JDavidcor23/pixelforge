import type { StateCreator } from 'zustand'

import { isSupabaseConfigured } from '@/config/env'
import type { AuthStore } from '@/types'

/**
 * Pure state only (same convention as every other slice in this workspace —
 * see `audio-library.slice.ts`): the Supabase calls themselves live in
 * `authService`, called from `useAuthSession.hook.ts` and the login-page
 * hooks, which then report the result back here via `setSession`/`clearSession`.
 */
export const createAuthSlice: StateCreator<AuthStore, [], [], AuthStore> = (set) => ({
  status: 'loading',
  user: null,
  isAvailable: isSupabaseConfigured(),

  setSession: (user) => set({ user, status: user ? 'signed-in' : 'signed-out' }),

  clearSession: () => set({ user: null, status: 'signed-out' }),
})
