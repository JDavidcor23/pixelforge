import { Link } from 'react-router-dom'

import { MascotScene } from './components/MascotScene/MascotScene'
import { GoogleButton } from './components/GoogleButton/GoogleButton'
import { AuthForm } from './components/AuthForm/AuthForm'
import { useLoginPage } from './useLoginPage.hook'
import { AUTH_COPY } from '@/constants/auth'
import { EDITOR_ROUTES } from '@/constants/routes'
import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'
import type { AuthFormMode } from '@/types'

const HEADING: Record<AuthFormMode, string> = {
  'sign-in': 'Sign in',
  'sign-up': 'Create your account',
  forgot: 'Reset your password',
}

const SUBTEXT: Record<AuthFormMode, string> = {
  'sign-in': 'Optional — you can keep drawing without an account. An account will let you save to the cloud.',
  'sign-up': 'Optional — you can keep drawing without an account. An account will let you save to the cloud.',
  forgot: "Enter your email and we'll send you a link to set a new password.",
}

const LINK_BUTTON = `self-start text-muted hover:text-ink ${MOTION.COLORS} ${FOCUS_RING.SURFACE} rounded`

export const LoginPage = () => {
  const { isAvailable, mode, setMode, isGoogleLoading, handleGoogleSignIn, privacyUrl, termsUrl } = useLoginPage()

  return (
    <div className="flex min-h-screen w-full flex-col bg-sunken text-ink lg:flex-row">
      <div className="relative order-2 flex items-center justify-center overflow-hidden bg-sunken px-6 py-10 lg:order-2 lg:w-[55%]">
        <div className="bg-grid bg-grid-fade pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(var(--pf-accent-rgb)/0.12)_0%,transparent_70%)]" />
        <MascotScene />
      </div>

      <div className="order-1 flex flex-1 items-center justify-center px-6 py-10 lg:order-1">
        <div className="w-full max-w-sm rounded-sm border border-line bg-surface p-8">
          <p className="font-mono text-2xs font-bold tracking-widest text-accent">PIXELFORGE</p>
          <h1 className="mt-4 text-lg font-semibold text-ink">{HEADING[mode]}</h1>
          <p className="mt-1.5 text-xs text-muted">{SUBTEXT[mode]}</p>

          {!isAvailable ? (
            <p className="mt-6 text-xs text-subtle">{AUTH_COPY.ACCOUNTS_UNAVAILABLE}</p>
          ) : (
            <>
              {mode !== 'forgot' && (
                <div className="mt-6">
                  <GoogleButton onClick={handleGoogleSignIn} isLoading={isGoogleLoading} />
                  <div className="my-5 flex items-center gap-3">
                    <div className="h-px flex-1 bg-line-strong" />
                    <span className="font-mono text-3xs uppercase tracking-wider text-subtle">or</span>
                    <div className="h-px flex-1 bg-line-strong" />
                  </div>
                </div>
              )}

              <AuthForm mode={mode} />

              <div className="mt-4 flex flex-col gap-2 text-xs">
                {mode === 'sign-in' && (
                  <button type="button" onClick={() => setMode('forgot')} className={LINK_BUTTON}>
                    Forgot password?
                  </button>
                )}
                {mode === 'forgot' ? (
                  <button type="button" onClick={() => setMode('sign-in')} className={LINK_BUTTON}>
                    Back to sign in
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
                    className={`text-center ${LINK_BUTTON}`}
                  >
                    {mode === 'sign-in' ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
                  </button>
                )}
              </div>
            </>
          )}

          <Link
            to={EDITOR_ROUTES.SPRITES}
            className={`mt-6 block text-center text-xs text-subtle hover:text-muted ${MOTION.COLORS} ${FOCUS_RING.SURFACE} rounded`}
          >
            Continue without an account
          </Link>

          <div className="mt-8 flex justify-center gap-4 border-t border-line pt-4 font-mono text-3xs text-subtle">
            <a href={privacyUrl} target="_blank" rel="noopener noreferrer" className="hover:text-muted">
              Privacy
            </a>
            <a href={termsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-muted">
              Terms
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
