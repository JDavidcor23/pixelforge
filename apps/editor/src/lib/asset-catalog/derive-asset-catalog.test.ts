import { describe, expect, it } from 'vitest'

import { deriveAssetCatalog } from './derive-asset-catalog'
import type { AIGeneration } from '@/types'
import type { AudioAsset } from '@/types/audio'

const makeGeneration = (overrides: Partial<AIGeneration> = {}): AIGeneration => ({
  id: 'g1',
  prompt: '  hero  ',
  base64: 'data:image/png;base64,AAAA',
  timestamp: 1,
  width: 16,
  height: 16,
  ...overrides,
})

const makeSound = (overrides: Partial<AudioAsset> = {}): AudioAsset => ({
  id: 's1',
  name: 'coin',
  tags: [],
  duration: 1,
  format: 'wav',
  fileSize: 10,
  associatedSpriteIds: [],
  createdAt: '2026-01-01',
  ...overrides,
})

describe('deriveAssetCatalog', () => {
  it('maps sprites and sounds, sprites first, with revision defaulting to 0', () => {
    const catalog = deriveAssetCatalog([makeGeneration()], [makeSound({ supabaseUrl: 'https://x/s1.wav' })])

    expect(catalog.allIds).toEqual(['g1', 's1'])
    expect(catalog.byId.g1).toEqual({
      id: 'g1',
      kind: 'sprite',
      revision: 0,
      name: 'hero',
      storage: { type: 'sprite-library', assetId: 'g1' },
      levelId: undefined,
      chatTurnId: undefined,
    })
    expect(catalog.byId.s1.kind).toBe('sound')
    expect(catalog.byId.s1.revision).toBe(0)
    expect(catalog.byId.s1.storage).toEqual({
      type: 'sound-source',
      supabaseUrl: 'https://x/s1.wav',
      localObjectUrl: undefined,
    })
  })

  it('uses stored revisions and the unnamed fallback', () => {
    const catalog = deriveAssetCatalog([makeGeneration({ revision: 3, prompt: ' ' })], [makeSound({ revision: 2 })])
    expect(catalog.byId.g1.revision).toBe(3)
    expect(catalog.byId.g1.name).toBe('Sin nombre')
    expect(catalog.byId.s1.revision).toBe(2)
  })

  it('never copies bytes into an entry', () => {
    const catalog = deriveAssetCatalog([makeGeneration()], [makeSound({ peaks: [0.1] })])
    expect(JSON.stringify(catalog)).not.toContain('AAAA')
    expect(JSON.stringify(catalog)).not.toContain('peaks')
  })

  it('keeps the previous catalog when nothing changed', () => {
    const generations = [makeGeneration()]
    const sounds = [makeSound()]
    const first = deriveAssetCatalog(generations, sounds)
    const second = deriveAssetCatalog([{ ...generations[0] }], [{ ...sounds[0] }], first)
    expect(second).toBe(first)
  })

  it('changes only the edited entry reference', () => {
    const first = deriveAssetCatalog([makeGeneration(), makeGeneration({ id: 'g2' })], [makeSound()])
    const second = deriveAssetCatalog(
      [makeGeneration({ revision: 1 }), makeGeneration({ id: 'g2' })],
      [makeSound()],
      first,
    )
    expect(second).not.toBe(first)
    expect(second.byId.g1).not.toBe(first.byId.g1)
    expect(second.byId.g2).toBe(first.byId.g2)
    expect(second.byId.s1).toBe(first.byId.s1)
    expect(second.allIds).toBe(first.allIds)
  })

  it('renders a new allIds when ids or order change, keeping unchanged entries', () => {
    const first = deriveAssetCatalog([makeGeneration()], [makeSound()])
    const second = deriveAssetCatalog([makeGeneration()], [], first)
    expect(second.allIds).toEqual(['g1'])
    expect(second.allIds).not.toBe(first.allIds)
    expect(second.byId.g1).toBe(first.byId.g1)
    expect(second.byId.s1).toBeUndefined()
  })
})
