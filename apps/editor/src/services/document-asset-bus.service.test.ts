import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  registerDocumentAssetCommands,
  requestDuplicateAsset,
  requestNewSprite,
  requestOpenAsset,
  resetDocumentAssetBusForTests,
} from './document-asset-bus.service'

describe('document asset bus', () => {
  beforeEach(() => {
    resetDocumentAssetBusForTests()
  })

  it('is a safe no-op before a controller registers: opening resolves false, new sprite does nothing', async () => {
    expect(await requestOpenAsset('a1')).toBe(false)
    expect(await requestDuplicateAsset({ name: 'x', assetType: 'character' })).toBe(false)
    expect(() => requestNewSprite()).not.toThrow()
  })

  it('forwards open/new to the registered controller commands until unregistered', async () => {
    const openAsset = vi.fn(async () => true)
    const newSprite = vi.fn()
    const duplicateAsset = vi.fn(async () => true)
    registerDocumentAssetCommands({ openAsset, newSprite, duplicateAsset })

    expect(await requestOpenAsset('a1')).toBe(true)
    requestNewSprite()
    expect(await requestDuplicateAsset({ name: 'x', assetType: 'character' })).toBe(true)
    expect(duplicateAsset).toHaveBeenCalledWith({ name: 'x', assetType: 'character' })
    expect(openAsset).toHaveBeenCalledWith('a1')
    expect(newSprite).toHaveBeenCalledTimes(1)

    registerDocumentAssetCommands(null)
    expect(await requestOpenAsset('a2')).toBe(false)
    expect(openAsset).toHaveBeenCalledTimes(1)
  })
})
