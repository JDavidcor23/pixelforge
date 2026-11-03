import { describe, expect, it, vi } from 'vitest'

import { openLibraryItem } from './open-library-item'
import type { AIAnimation, AssetLibraryItem, OpenLibraryItemDeps } from '@/types'

const item = (kind: AssetLibraryItem['kind'], id = 'x'): AssetLibraryItem => ({
  id,
  kind,
  label: 'Item',
  thumbnailSrc: '',
  assetType: 'character',
  isAnimated: kind === 'animation',
})

const animation = { id: 'anim', frames: ['f1'], frameDurationMs: 100 } as unknown as AIAnimation

const makeDeps = (): OpenLibraryItemDeps => ({
  openAsset: vi.fn().mockResolvedValue(true),
  newSprite: vi.fn(),
  findAnimation: vi.fn().mockReturnValue(animation),
  applyAnimation: vi.fn().mockResolvedValue(undefined),
})

describe('openLibraryItem (ADR 0015: a tile click opens the asset, never overwrites the open one)', () => {
  it.each(['drawing', 'generation'] as const)('opens a %s asset by id', async (kind) => {
    const deps = makeDeps()
    await openLibraryItem(item(kind, 'sprite-1'), deps)
    expect(deps.openAsset).toHaveBeenCalledWith('sprite-1')
    expect(deps.newSprite).not.toHaveBeenCalled()
    expect(deps.applyAnimation).not.toHaveBeenCalled()
  })

  it('puts an animation on a new sprite, so the open asset keeps its pixels', async () => {
    const deps = makeDeps()
    const order: string[] = []
    vi.mocked(deps.newSprite).mockImplementation(() => order.push('new'))
    vi.mocked(deps.applyAnimation).mockImplementation(async () => {
      order.push('apply')
    })
    await openLibraryItem(item('animation', 'anim'), deps)
    expect(order).toEqual(['new', 'apply'])
    expect(deps.applyAnimation).toHaveBeenCalledWith(animation)
    expect(deps.openAsset).not.toHaveBeenCalled()
  })

  it('does nothing for an animation that is no longer in Assets', async () => {
    const deps = makeDeps()
    vi.mocked(deps.findAnimation).mockReturnValue(undefined)
    await openLibraryItem(item('animation', 'gone'), deps)
    expect(deps.newSprite).not.toHaveBeenCalled()
    expect(deps.applyAnimation).not.toHaveBeenCalled()
  })
})
