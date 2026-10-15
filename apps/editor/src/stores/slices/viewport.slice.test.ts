import { describe, it, expect, beforeEach } from 'vitest'

import { useEditorPrefsStore } from '@/stores/prefs.store'
import { SPRITE_EDITOR_CANVAS } from '@/constants'

import { getCenterViewZoom } from './viewport.slice'

const store = () => useEditorPrefsStore.getState()

describe('getCenterViewZoom', () => {
  it('returns the unchanged baseline zoom for the default 64x64 canvas', () => {
    expect(getCenterViewZoom(64, 64)).toBe(9)
  })

  it('scales down for a 128x128 canvas (owner: "at least 400 for 128")', () => {
    expect(getCenterViewZoom(128, 128)).toBeCloseTo(4.5)
  })

  it('scales down further for a 256x256 canvas', () => {
    expect(getCenterViewZoom(256, 256)).toBeCloseTo(2.25)
  })

  it('uses the larger dimension for a non-square canvas', () => {
    expect(getCenterViewZoom(64, 128)).toBeCloseTo(4.5)
    expect(getCenterViewZoom(128, 64)).toBeCloseTo(4.5)
  })

  it('clamps to MAX_ZOOM for a tiny canvas', () => {
    expect(getCenterViewZoom(1, 1)).toBe(SPRITE_EDITOR_CANVAS.MAX_ZOOM)
  })

  it('clamps to MIN_ZOOM for a huge canvas', () => {
    expect(getCenterViewZoom(10000, 10000)).toBe(SPRITE_EDITOR_CANVAS.MIN_ZOOM)
  })
})

describe('resetViewport', () => {
  beforeEach(() => {
    useEditorPrefsStore.setState(useEditorPrefsStore.getInitialState())
  })

  it('snaps zoom to the baseline and zeroes the offset for a 64x64 canvas', () => {
    store().setViewportOffset(40, -40)
    store().resetViewport(64, 64)
    expect(store().viewport).toEqual({ zoom: 9, offsetX: 0, offsetY: 0 })
  })

  it('snaps zoom to the size-aware value for a 128x128 canvas', () => {
    store().resetViewport(128, 128)
    expect(store().viewport.zoom).toBeCloseTo(4.5)
    expect(store().viewport.offsetX).toBe(0)
    expect(store().viewport.offsetY).toBe(0)
  })
})
