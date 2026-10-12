import { useEffect } from 'react'
import type { User } from '@supabase/supabase-js'

import { useAuthStore } from '@/stores/auth.store'
import { authService } from '@/services/auth.service'

/**
 * Mounted once at the app root (`App.tsx`) so the session is known on EVERY
 * route — including `/login` and `/reset-password`, which sit outside
 * `EditorLayout`. Accounts are optional: when `isAvailable` is `false`
 * (`VITE_SUPABASE_*` missing) this resolves straight to `'signed-out'`
 * against the placeholder Supabase host instead of hanging on `'loading'`.
 */
export function useAuthSession(): void {
  const isAvailable = useAuthStore((state) => state.isAvailable)
  const setSession = useAuthStore((state) => state.setSession)
  const clearSession = useAuthStore((state) => state.clearSession)

  useEffect(() => {
    if (!isAvailable) {
      clearSession()
      return
    }

    let cancelled = false

    const applySession = async (user: User | null) => {
      if (!user) {
        if (!cancelled) clearSession()
        return
      }
      const mapped = await authService.applyProfileOverride(authService.mapUser(user))
      if (!cancelled) setSession(mapped)
    }

    authService
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to restore Supabase session', error)
          return
        }
        return applySession(data.session?.user ?? null)
      })
      .catch((error: unknown) => {
        console.error('Failed to restore Supabase session', error)
      })

    const {
      data: { subscription },
    } = authService.onAuthStateChange((_event, session) => {
      void applySession(session?.user ?? null)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [isAvailable, setSession, clearSession])
}
