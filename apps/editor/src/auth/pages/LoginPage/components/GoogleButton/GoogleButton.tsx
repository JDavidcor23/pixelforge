import { GoogleIcon } from './GoogleIcon'
import { DISABLED_STATE, FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'

interface GoogleButtonProps {
  readonly onClick: () => void
  readonly isLoading: boolean
}

const BUTTON = `flex w-full items-center justify-center gap-2.5 rounded border border-line-strong bg-raised px-4 py-2.5 text-sm font-medium text-ink hover:bg-hover ${MOTION.PRESS} ${FOCUS_RING.SURFACE} ${DISABLED_STATE}`

export const GoogleButton = ({ onClick, isLoading }: GoogleButtonProps) => (
  <button type="button" onClick={onClick} disabled={isLoading} className={BUTTON}>
    <GoogleIcon />
    {isLoading ? 'Connecting…' : 'Continue with Google'}
  </button>
)
