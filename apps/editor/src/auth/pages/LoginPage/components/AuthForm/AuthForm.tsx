import { Eye, EyeOff } from 'lucide-react'

import { useAuthForm } from './useAuthForm.hook'
import { DISABLED_STATE, FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'
import type { AuthFormMode } from '@/types'

interface AuthFormProps {
  readonly mode: AuthFormMode
}

const LABEL = 'mb-1.5 block text-xs font-medium text-muted'
const INPUT = `w-full rounded border border-line-strong bg-base px-3 py-2 text-sm text-ink placeholder:text-subtle ${FOCUS_RING.INPUT}`
const SUBMIT = `w-full rounded bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent hover:bg-accent-strong ${MOTION.PRESS} ${FOCUS_RING.SURFACE} ${DISABLED_STATE}`
const EYE_BUTTON = `absolute inset-y-0 right-2 flex items-center text-subtle hover:text-muted ${MOTION.COLORS} ${FOCUS_RING.SURFACE} rounded`

const SUBMIT_LABEL: Record<AuthFormMode, string> = {
  'sign-in': 'Sign in',
  'sign-up': 'Create account',
  forgot: 'Send reset link',
}

const SUBMITTING_LABEL: Record<AuthFormMode, string> = {
  'sign-in': 'Signing in…',
  'sign-up': 'Creating account…',
  forgot: 'Sending…',
}

export const AuthForm = ({ mode }: AuthFormProps) => {
  const {
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
  } = useAuthForm(mode)

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div>
        <label htmlFor="auth-email" className={LABEL}>
          Email
        </label>
        <input
          id="auth-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={INPUT}
          placeholder="you@example.com"
        />
      </div>

      {mode !== 'forgot' && (
        <div>
          <label htmlFor="auth-password" className={LABEL}>
            Password
          </label>
          <div className="relative">
            <input
              id="auth-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={`${INPUT} pr-9`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={toggleShowPassword}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className={EYE_BUTTON}
            >
              {showPassword ? <EyeOff size={15} aria-hidden /> : <Eye size={15} aria-hidden />}
            </button>
          </div>
        </div>
      )}

      {errorMessage && (
        <p ref={errorRef} role="alert" tabIndex={-1} className="text-xs text-danger outline-none">
          {errorMessage}
        </p>
      )}
      {infoMessage && (
        <p role="status" aria-live="polite" className="text-xs text-success">
          {infoMessage}
        </p>
      )}

      <button type="submit" disabled={isSubmitting} className={SUBMIT}>
        {isSubmitting ? SUBMITTING_LABEL[mode] : SUBMIT_LABEL[mode]}
      </button>
    </form>
  )
}
