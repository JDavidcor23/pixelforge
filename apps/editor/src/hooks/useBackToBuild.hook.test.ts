import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { EDITOR_ROUTES } from '@/constants/routes'
import { useBackToBuild } from './useBackToBuild.hook'

const navigate = vi.fn()
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }))

describe('useBackToBuild', () => {
  it('returns a callback that navigates to /build', () => {
    let goBack: (() => void) | undefined
    const Probe = () => {
      goBack = useBackToBuild()
      return null
    }
    renderToString(createElement(Probe))
    goBack?.()
    expect(navigate).toHaveBeenCalledWith(EDITOR_ROUTES.BUILD)
  })
})
