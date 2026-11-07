import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  registerDocumentAssetCommands,
  requestDuplicateAsset,
  requestNewSprite,
  requestOpenAsset,
  resetDocumentAssetBusForTests,
  waitForDocumentAssetCommands,
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

describe('document asset bus readiness', () => {
  beforeEach(() => {
    resetDocumentAssetBusForTests()
  })

  const commands = () => ({ openAsset: vi.fn(async () => true), newSprite: vi.fn(), duplicateAsset: vi.fn(async () => true) })

  it('resolves immediately when commands are already registered', async () => {
    registerDocumentAssetCommands(commands())
    await expect(waitForDocumentAssetCommands()).resolves.toBeUndefined()
  })

  it('stays pending until commands register, then resolves every waiter', async () => {
    let resolved = 0
    const first = waitForDocumentAssetCommands().then(() => resolved++)
    const second = waitForDocumentAssetCommands().then(() => resolved++)
    await Promise.resolve()
    expect(resolved).toBe(0)
    registerDocumentAssetCommands(commands())
    await Promise.all([first, second])
    expect(resolved).toBe(2)
  })

  it('goes back to pending after the commands are unregistered', async () => {
    registerDocumentAssetCommands(commands())
    registerDocumentAssetCommands(null)
    let resolved = false
    void waitForDocumentAssetCommands().then(() => {
      resolved = true
    })
    await Promise.resolve()
    expect(resolved).toBe(false)
    registerDocumentAssetCommands(commands())
    await Promise.resolve()
    expect(resolved).toBe(true)
  })
})
