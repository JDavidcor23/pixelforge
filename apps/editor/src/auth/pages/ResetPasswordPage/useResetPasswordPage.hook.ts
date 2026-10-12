import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { authService } from '@/services/auth.service'
import { mapAuthError } from '@/lib/map-auth-error'
import { AUTH_COPY, RESET_PASSWORD_REDIRECT_DELAY_MS } from '@/constants/auth'
import { EDITOR_ROUTES } from '@/constants/routes'

/**
 * Lands here from the email link `resetPasswordForEmail` sent — Supabase's
 * client reads the recovery token out of the URL (`detectSessionInUrl`,
 * default `true`) and already has a short-lived recovery session by the time
 * this mounts, so `updateUser({ password })` is enough; no token handling here.
 */
export function useResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isDone, setIsDone] = useState(false)
  const errorRef = useRef<HTMLParagraphElement>(null)

  /** Moves focus to the error banner as soon as it renders, so screen-reader users land on it immediately. */
  useEffect(() => {
    if (errorMessage) errorRef.current?.focus()
  }, [errorMessage])

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setErrorMessage(null)
      setIsSubmitting(true)
      const { error } = await authService.updatePassword(password)
      setIsSubmitting(false)

      if (error) {
        setErrorMessage(mapAuthError(error))
        return
      }

      setIsDone(true)
      setTimeout(() => navigate(EDITOR_ROUTES.SPRITES), RESET_PASSWORD_REDIRECT_DELAY_MS)
    },
    [password, navigate],
  )

  return {
    password,
    setPassword,
    isSubmitting,
    errorMessage,
    errorRef,
    isDone,
    successMessage: AUTH_COPY.PASSWORD_UPDATED,
    handleSubmit,
  }
}
