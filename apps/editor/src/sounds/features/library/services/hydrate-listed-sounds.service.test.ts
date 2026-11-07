import { afterEach, describe, expect, it, vi } from 'vitest'

import type { AudioAsset } from '@/types/audio'
import { hydrateListedSounds } from './hydrate-listed-sounds.service'

const sound = (id: string): AudioAsset => ({
  id,
  name: id,
  tags: [],
  duration: 0,
  format: 'audio/wav',
  fileSize: 0,
  associatedSpriteIds: [],
  createdAt: '2026-01-01T00:00:00.000Z',
})

afterEach(() => vi.restoreAllMocks())

describe('hydrateListedSounds', () => {
  it('lists the bucket for the user and hands the result to applyListed', async () => {
    const listAssets = vi.fn().mockResolvedValue([sound('a')])
    const applyListed = vi.fn()
    await hydrateListedSounds({ userId: 'u1', listAssets, applyListed, isCurrent: () => true })
    expect(listAssets).toHaveBeenCalledWith('u1')
    expect(applyListed).toHaveBeenCalledWith([{ ...sound('a'), fromBucketListing: true }])
  })

  it('does not apply a listing that resolves after the user changed', async () => {
    let current = true
    const applyListed = vi.fn()
    await hydrateListedSounds({
      userId: 'u1',
      listAssets: async () => {
        current = false
        return [sound('a')]
      },
      applyListed,
      isCurrent: () => current,
    })
    expect(applyListed).not.toHaveBeenCalled()
  })

  it('skips applying when the bucket is empty', async () => {
    const applyListed = vi.fn()
    await hydrateListedSounds({ userId: 'u1', listAssets: async () => [], applyListed, isCurrent: () => true })
    expect(applyListed).not.toHaveBeenCalled()
  })

  it('logs with console.error and leaves the store alone when listing fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const applyListed = vi.fn()
    await expect(
      hydrateListedSounds({
        userId: 'u1',
        listAssets: async () => {
          throw new Error('boom')
        },
        applyListed,
        isCurrent: () => true,
      }),
    ).resolves.toBeUndefined()
    expect(applyListed).not.toHaveBeenCalled()
    expect(error).toHaveBeenCalledTimes(1)
  })
})
