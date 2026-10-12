import { useCallback, useState } from 'react'

import { useAuthStore } from '@/stores/auth.store'
import { authService } from '@/services/auth.service'
import { getLandingUrl } from '@/config/env'
import { LANDING_ROUTES } from '@/constants/routes'
import type { AuthFormMode } from '@/types'

export function useLoginPage() {
  const isAvailable = useAuthStore((state) => state.isAvailable)
  const [mode, setMode] = useState<AuthFormMode>('sign-in')
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const handleGoogleSignIn = useCallback(() => {
    setIsGoogleLoading(true)
    authService.signInWithGoogle().catch((error: unknown) => {
      console.error('Google sign-in failed to start', error)
      setIsGoogleLoading(false)
    })
    // On success the browser navigates away to Google — nothing else to do here.
  }, [])

  const landingUrl = getLandingUrl()

  return {
    isAvailable,
    mode,
    setMode,
    isGoogleLoading,
    handleGoogleSignIn,
    privacyUrl: `${landingUrl}${LANDING_ROUTES.PRIVACY}`,
    termsUrl: `${landingUrl}${LANDING_ROUTES.TERMS}`,
  }
}
