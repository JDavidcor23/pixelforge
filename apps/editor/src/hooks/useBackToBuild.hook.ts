import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

import { EDITOR_ROUTES } from '@/constants/routes'

/** Returns a callback that navigates back to the Build screen (ADR 0015 deep links). */
export function useBackToBuild(): () => void {
  const navigate = useNavigate()
  return useCallback(() => navigate(EDITOR_ROUTES.BUILD), [navigate])
}
