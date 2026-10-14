import { describe, expect, it } from 'vitest'

import {
  buildAssetReference,
  buildCanvasReference,
  canvasFrameReferenceLabel,
  resolveAnimationReferenceImage,
} from './animation-reference'
import type { AssetLibraryItem } from '@/types'

const ASSET: AssetLibraryItem = {
  id: 'asset-1',
  kind: 'animation',
  label: 'Wizard idle',
  thumbnailSrc: 'data:image/png;base64,ASSET',
  assetType: 'character',
  isAnimated: true,
}

describe('canvasFrameReferenceLabel', () => {
  it('is 1-based', () => {
    expect(canvasFrameReferenceLabel(0)).toBe('Frame 1')
    expect(canvasFrameReferenceLabel(2)).toBe('Frame 3')
  })
})

describe('buildCanvasReference', () => {
  it('locks a snapshot tagged with its canvas source and frame label', () => {
    const reference = buildCanvasReference(2, 'data:image/png;base64,FRAME')

    expect(reference).toEqual({
      source: { kind: 'canvas', frameIndex: 2 },
      imageBase64: 'data:image/png;base64,FRAME',
      label: 'Frame 3',
    })
  })
})

describe('buildAssetReference', () => {
  it('locks a snapshot tagged with its asset id and the asset label', () => {
    const reference = buildAssetReference(ASSET, 'data:image/png;base64,ASSET')

    expect(reference).toEqual({
      source: { kind: 'asset', assetId: 'asset-1' },
      imageBase64: 'data:image/png;base64,ASSET',
      label: 'Wizard idle',
    })
  })
})

describe('resolveAnimationReferenceImage', () => {
  it('reads the locked reference image, never a live canvas export', () => {
    const reference = buildCanvasReference(0, 'data:image/png;base64,LOCKED')
    expect(resolveAnimationReferenceImage(reference)).toBe('data:image/png;base64,LOCKED')
  })

  it('returns null when nothing has been locked yet', () => {
    expect(resolveAnimationReferenceImage(null)).toBeNull()
  })
})
