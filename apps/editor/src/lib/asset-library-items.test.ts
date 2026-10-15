import { describe, expect, it } from 'vitest'

import { buildAssetLibraryItems } from './asset-library-items'
import type { AIAnimation, AIGeneration } from '@/types'

const generation = (overrides: Partial<AIGeneration> = {}): AIGeneration => ({
  id: 'gen-1',
  prompt: 'a knight',
  base64: 'data:image/png;base64,gen',
  timestamp: 1,
  width: 32,
  height: 32,
  ...overrides,
})

const animation = (overrides: Partial<AIAnimation> = {}): AIAnimation => ({
  pipelineVersion: 1,
  id: 'anim-1',
  label: 'walk cycle',
  frames: ['data:image/png;base64,frame0', 'data:image/png;base64,frame1'],
  frameDurationMs: 100,
  timestamp: 2,
  ...overrides,
})

describe('buildAssetLibraryItems', () => {
  it('surfaces a Save As drawing (ADR 0010 Phase 1) as kind "drawing"', () => {
    const items = buildAssetLibraryItems({
      generations: [generation({ id: 'drawing-1', kind: 'drawing' })],
      animations: [],
    })

    expect(items).toEqual([
      expect.objectContaining({ id: 'drawing-1', kind: 'drawing' }),
    ])
  })

  it('defaults a generation with no `kind` to "generation" (back-compat)', () => {
    const items = buildAssetLibraryItems({ generations: [generation()], animations: [] })

    expect(items[0]).toMatchObject({ kind: 'generation' })
  })

  it('maps an animation to kind "animation" using its first frame as the thumbnail', () => {
    const items = buildAssetLibraryItems({ generations: [], animations: [animation()] })

    expect(items[0]).toMatchObject({
      kind: 'animation',
      isAnimated: true,
      thumbnailSrc: 'data:image/png;base64,frame0',
    })
  })

  it('sorts combined generations and animations newest-first by timestamp', () => {
    const items = buildAssetLibraryItems({
      generations: [generation({ id: 'old', timestamp: 1 })],
      animations: [animation({ id: 'new', timestamp: 2 })],
    })

    expect(items.map((item) => item.id)).toEqual(['new', 'old'])
  })
})
