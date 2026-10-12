import { useResetPasswordPage } from './useResetPasswordPage.hook'
import { DISABLED_STATE, FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'

const INPUT = `w-full rounded border border-line-strong bg-base px-3 py-2 text-sm text-ink placeholder:text-subtle ${FOCUS_RING.INPUT}`
const SUBMIT = `w-full rounded bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent hover:bg-accent-strong ${MOTION.PRESS} ${FOCUS_RING.SURFACE} ${DISABLED_STATE}`

export const ResetPasswordPage = () => {
  const { password, setPassword, isSubmitting, errorMessage, errorRef, isDone, successMessage, handleSubmit } =
    useResetPasswordPage()

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-base px-6 text-ink">
      <div className="w-full max-w-sm rounded-sm border border-line bg-surface p-8">
        <p className="font-mono text-2xs font-bold tracking-widest text-accent">PIXELFORGE</p>
        <h1 className="mt-4 text-lg font-semibold text-ink">Set a new password</h1>
        <p className="mt-1.5 text-xs text-muted">Choose a new password for your account.</p>

        {isDone ? (
          <p role="status" aria-live="polite" className="mt-6 text-xs text-success">
            {successMessage}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
            <div>
              <label htmlFor="new-password" className="mb-1.5 block text-xs font-medium text-muted">
                New password
              </label>
              <input
                id="new-password"
                name="new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={INPUT}
                placeholder="••••••••"
              />
            </div>

            {errorMessage && (
              <p ref={errorRef} role="alert" tabIndex={-1} className="text-xs text-danger outline-none">
                {errorMessage}
              </p>
            )}

            <button type="submit" disabled={isSubmitting} className={SUBMIT}>
              {isSubmitting ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
