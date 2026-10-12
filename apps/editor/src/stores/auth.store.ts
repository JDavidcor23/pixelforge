import { create } from 'zustand'

import type { AuthStore } from '@/types'

import { createAuthSlice } from './slices/auth.slice'

/**
 * Session is NOT persisted here — Supabase's own client already persists it
 * (`createClient` defaults to `persistSession: true` against `localStorage`,
 * see `lib/supabase.ts`). `useAuthSession.hook.ts` just mirrors whatever
 * Supabase reports into this store on mount and on every auth state change.
 */
export const useAuthStore = create<AuthStore>()((...a) => ({
  ...createAuthSlice(...a),
}))
