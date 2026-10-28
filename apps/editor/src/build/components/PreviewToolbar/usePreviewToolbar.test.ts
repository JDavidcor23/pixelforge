import { describe, expect, it } from 'vitest'

import { getPlaybackToggle } from './usePreviewToolbar.hook'
import { BUILD_SCREEN_COPY } from '@/constants/build-screen'

describe('getPlaybackToggle', () => {
  it('sends pause and is labelled "Pausar" while the game runs', () => {
    expect(getPlaybackToggle(false)).toEqual({
      command: 'pause',
      label: BUILD_SCREEN_COPY.PREVIEW_PAUSE,
    })
  })

  it('sends resume and is labelled "Reanudar" while the game is paused', () => {
    expect(getPlaybackToggle(true)).toEqual({
      command: 'resume',
      label: BUILD_SCREEN_COPY.PREVIEW_RESUME,
    })
  })
})
