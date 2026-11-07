import { describe, expect, it, vi } from 'vitest'

import { openSoundDeepLink, openSpriteDeepLink, readAssetDeepLinkId, withoutAssetDeepLink } from './asset-deep-link.service'

describe('readAssetDeepLinkId', () => {
  it('returns the asset id, or null when absent or empty', () => {
    expect(readAssetDeepLinkId(new URLSearchParams('asset=abc'))).toBe('abc')
    expect(readAssetDeepLinkId(new URLSearchParams(''))).toBeNull()
    expect(readAssetDeepLinkId(new URLSearchParams('asset='))).toBeNull()
  })
})

describe('withoutAssetDeepLink', () => {
  it('drops only the asset param and does not mutate the input', () => {
    const input = new URLSearchParams('asset=abc&x=1')
    const output = withoutAssetDeepLink(input)
    expect(output.toString()).toBe('x=1')
    expect(input.get('asset')).toBe('abc')
  })
})

describe('openSpriteDeepLink', () => {
  it('waits for the commands to be ready, then opens the asset', async () => {
    const order: string[] = []
    const waitForCommands = vi.fn(async () => {
      order.push('ready')
    })
    const openAsset = vi.fn(async () => {
      order.push('open')
      return true
    })
    await expect(openSpriteDeepLink('a1', { waitForCommands, openAsset })).resolves.toBe(true)
    expect(order).toEqual(['ready', 'open'])
    expect(openAsset).toHaveBeenCalledWith('a1')
  })

  it('resolves false for an unknown id (the restored asset is left alone)', async () => {
    const openAsset = vi.fn(async () => false)
    await expect(openSpriteDeepLink('nope', { waitForCommands: async () => {}, openAsset })).resolves.toBe(false)
  })
})

describe('openSoundDeepLink', () => {
  it('opens a known sound', () => {
    const openSound = vi.fn()
    expect(openSoundDeepLink('s1', { knownIds: ['s0', 's1'], openSound })).toBe(true)
    expect(openSound).toHaveBeenCalledWith('s1')
  })

  it('does nothing for an unknown sound', () => {
    const openSound = vi.fn()
    expect(openSoundDeepLink('zzz', { knownIds: ['s0'], openSound })).toBe(false)
    expect(openSound).not.toHaveBeenCalled()
  })
})
