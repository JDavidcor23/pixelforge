import { describe, expect, it, vi } from 'vitest'

import {
  ANIMATION_HISTORY_STORAGE_KEY,
  ANIMATION_HISTORY_LIMIT,
  ANIMATION_PIPELINE_VERSION,
} from '@/app/editor/constants'
import type { AIAnimation } from '@/app/editor/types'
import { parseAnimationHistory, persistAnimationHistory } from './animation-history'

const PNG_DATA_URI =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLkWQAAAABJRU5ErkJggg=='

const CURRENT_ANIMATION: AIAnimation = {
  pipelineVersion: ANIMATION_PIPELINE_VERSION,
  id: 'animation-1',
  label: 'Attack · Right',
  frames: [PNG_DATA_URI],
  frameDurationMs: 120,
  timestamp: 1_783_939_501_921,
}

describe('parseAnimationHistory', () => {
  it('accepts entries produced by the current animation pipeline', () => {
    expect(parseAnimationHistory(JSON.stringify([CURRENT_ANIMATION]))).toEqual({
      animations: [CURRENT_ANIMATION],
      requiresRewrite: false,
    })
  })

  it('invalidates unversioned legacy frames that cannot be re-sliced', () => {
    const { pipelineVersion: _pipelineVersion, ...legacyAnimation } = CURRENT_ANIMATION

    expect(parseAnimationHistory(JSON.stringify([legacyAnimation]))).toEqual({
      animations: [],
      requiresRewrite: true,
    })
  })

  it('keeps compatible entries while removing legacy and malformed entries', () => {
    const legacyAnimation = { ...CURRENT_ANIMATION, pipelineVersion: undefined }
    const malformedAnimation = { ...CURRENT_ANIMATION, id: '', frames: ['not-a-png'] }

    expect(
      parseAnimationHistory(
        JSON.stringify([CURRENT_ANIMATION, legacyAnimation, malformedAnimation]),
      ),
    ).toEqual({
      animations: [CURRENT_ANIMATION],
      requiresRewrite: true,
    })
  })

  it('removes duplicate ids so rendered history keys stay unique', () => {
    expect(parseAnimationHistory(JSON.stringify([CURRENT_ANIMATION, CURRENT_ANIMATION]))).toEqual({
      animations: [CURRENT_ANIMATION],
      requiresRewrite: true,
    })
  })

  it('invalidates malformed JSON and unexpected root values', () => {
    expect(parseAnimationHistory('{')).toEqual({ animations: [], requiresRewrite: true })
    expect(parseAnimationHistory(JSON.stringify({ animations: [] }))).toEqual({
      animations: [],
      requiresRewrite: true,
    })
  })
})

describe('persistAnimationHistory', () => {
  it('removes storage when migration leaves no compatible entries', () => {
    const removeItem = vi.fn()
    const setItem = vi.fn()

    persistAnimationHistory({ removeItem, setItem }, [])

    expect(removeItem).toHaveBeenCalledWith(ANIMATION_HISTORY_STORAGE_KEY)
    expect(setItem).not.toHaveBeenCalled()
  })

  it('rewrites storage with only compatible entries', () => {
    const removeItem = vi.fn()
    const setItem = vi.fn()

    persistAnimationHistory({ removeItem, setItem }, [CURRENT_ANIMATION])

    expect(setItem).toHaveBeenCalledWith(
      ANIMATION_HISTORY_STORAGE_KEY,
      JSON.stringify([CURRENT_ANIMATION]),
    )
    expect(removeItem).not.toHaveBeenCalled()
  })

  it('never persists more entries than the configured history limit', () => {
    const removeItem = vi.fn()
    const setItem = vi.fn()
    const animations = Array.from({ length: ANIMATION_HISTORY_LIMIT + 1 }, (_, index) => ({
      ...CURRENT_ANIMATION,
      id: `animation-${index}`,
    }))

    persistAnimationHistory({ removeItem, setItem }, animations)

    expect(setItem).toHaveBeenCalledWith(
      ANIMATION_HISTORY_STORAGE_KEY,
      JSON.stringify(animations.slice(0, ANIMATION_HISTORY_LIMIT)),
    )
  })
})
