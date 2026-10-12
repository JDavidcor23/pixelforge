import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuthStore } from '@/stores/auth.store'
import { authService } from '@/services/auth.service'
import { mapAuthError } from '@/lib/map-auth-error'
import { AUTH_COPY } from '@/constants/auth'
import { EDITOR_ROUTES } from '@/constants/routes'
import type { AuthFormMode } from '@/types'

export function useAuthForm(mode: AuthFormMode) {
  const navigate = useNavigate()
  const setSession = useAuthStore((state) => state.setSession)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)

  /** Moves focus to the error banner as soon as it renders, so screen-reader users land on it immediately. */
  useEffect(() => {
    if (errorMessage) errorRef.current?.focus()
  }, [errorMessage])

  const toggleShowPassword = useCallback(() => setShowPassword((show) => !show), [])

  const handleSignIn = useCallback(async () => {
    const { data, error } = await authService.signInWithPassword(email, password)
    if (error) {
      setErrorMessage(mapAuthError(error))
      return
    }
    setSession(authService.mapUser(data.user))
    navigate(EDITOR_ROUTES.SPRITES)
  }, [email, password, setSession, navigate])

  const handleSignUp = useCallback(async () => {
    const { data, error } = await authService.signUp(email, password)
    if (error) {
      setErrorMessage(mapAuthError(error))
      return
    }
    if (data.session && data.user) {
      // Email confirmation is disabled for this project — a session comes back immediately.
      setSession(authService.mapUser(data.user))
      navigate(EDITOR_ROUTES.SPRITES)
      return
    }
    setInfoMessage(AUTH_COPY.CHECK_EMAIL)
  }, [email, password, setSession, navigate])

  const handleForgotPassword = useCallback(async () => {
    const { error } = await authService.resetPasswordForEmail(email)
    // Same confirmation whether or not the email exists — never reveal which accounts are real.
    if (error) console.error('resetPasswordForEmail failed', error)
    setInfoMessage(AUTH_COPY.RESET_EMAIL_SENT)
  }, [email])

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setErrorMessage(null)
      setInfoMessage(null)
      setIsSubmitting(true)
      try {
        if (mode === 'sign-in') await handleSignIn()
        else if (mode === 'sign-up') await handleSignUp()
        else await handleForgotPassword()
      } finally {
        setIsSubmitting(false)
      }
    },
    [mode, handleSignIn, handleSignUp, handleForgotPassword],
  )

  return {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    toggleShowPassword,
    isSubmitting,
    errorMessage,
    errorRef,
    infoMessage,
    handleSubmit,
  }
}
