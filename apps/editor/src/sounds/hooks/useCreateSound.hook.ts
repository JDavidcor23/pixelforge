import { useCallback } from 'react'

import { useSoundsStore } from '@/stores/sounds.store'
import { audioBufferCache } from '@/lib/audio-buffer-cache'
import { audioEngine } from '@/lib/audio-engine'
import { decodeAudioBlob } from '@/lib/audio-encoder'
import { getPresetById } from '@/lib/audio-presets'
import {
  buildAsset,
  buildUniqueName,
  describeSound,
  perturbSynthParams,
  renderSynthSound,
  slugify,
  withNameSuffix,
} from '@/lib/sound-assets'
import {
  DEFAULT_SOUND_KIND,
  DUPLICATE_NAME_SUFFIX,
  PRESET_TILES,
  PROMPT_SLUG_MAX_LENGTH,
  VARIATION_COUNT,
  VARIATION_NAME_SUFFIX,
  WAV_MIME_TYPE,
} from '@/constants/sound-library'
import type { AudioAsset } from '@/types/audio'

const FILE_EXTENSION = /\.[^.]+$/

/** Read at call time: names must be fresh after an await, and no re-render is needed. */
const getExistingNames = (): string[] =>
  useSoundsStore.getState().assets.map((asset) => asset.name)

/**
 * Every way a sound enters the library outside of AI generation: from a
 * preset, as a duplicate, as synth variations, or from an imported file.
 */
export function useCreateSound() {
  const addAsset = useSoundsStore((state) => state.addAsset)
  const setSelectedAsset = useSoundsStore((state) => state.setSelectedAsset)

  const createFromPreset = useCallback(
    async (presetId: string): Promise<AudioAsset | null> => {
      const preset = getPresetById(presetId)
      if (!preset) return null

      const label = PRESET_TILES.find((tile) => tile.presetId === presetId)?.label ?? preset.name
      const rendered = await renderSynthSound(preset.params)
      const asset = buildAsset({
        name: buildUniqueName(slugify(label, PROMPT_SLUG_MAX_LENGTH), getExistingNames()),
        tags: [DEFAULT_SOUND_KIND],
        source: 'synth',
        rendered,
        synthParams: preset.params,
        presetId,
      })

      audioBufferCache.set(asset.id, rendered.buffer)
      addAsset(asset)
      setSelectedAsset(asset.id)
      return asset
    },
    [addAsset, setSelectedAsset]
  )

  const duplicate = useCallback(
    (asset: AudioAsset): AudioAsset => {
      const copy: AudioAsset = {
        ...asset,
        id: crypto.randomUUID(),
        name: buildUniqueName(withNameSuffix(asset.name, DUPLICATE_NAME_SUFFIX), getExistingNames()),
        createdAt: new Date().toISOString(),
        associatedSpriteIds: [...asset.associatedSpriteIds],
        tags: [...asset.tags],
      }

      const buffer = audioBufferCache.get(asset.id)
      if (buffer) audioBufferCache.set(copy.id, buffer)
      addAsset(copy)
      setSelectedAsset(copy.id)
      return copy
    },
    [addAsset, setSelectedAsset]
  )

  const createVariations = useCallback(
    async (asset: AudioAsset): Promise<void> => {
      if (!asset.synthParams) return

      const taken = getExistingNames()
      for (let index = 1; index <= VARIATION_COUNT; index++) {
        const params = perturbSynthParams(asset.synthParams)
        const rendered = await renderSynthSound(params)
        const name = buildUniqueName(withNameSuffix(asset.name, `${VARIATION_NAME_SUFFIX}${index}`), taken)
        taken.push(name)

        const variation = buildAsset({
          name,
          tags: [...asset.tags],
          source: 'synth',
          rendered,
          synthParams: params,
          presetId: asset.presetId,
        })
        audioBufferCache.set(variation.id, rendered.buffer)
        addAsset(variation)
      }
    },
    [addAsset]
  )

  const importFile = useCallback(
    async (file: File): Promise<AudioAsset> => {
      const buffer = await decodeAudioBlob(file, audioEngine.getContext())
      const rendered = describeSound(buffer, file)
      const asset = buildAsset({
        name: buildUniqueName(
          slugify(file.name.replace(FILE_EXTENSION, ''), PROMPT_SLUG_MAX_LENGTH),
          getExistingNames()
        ),
        tags: [DEFAULT_SOUND_KIND],
        source: 'import',
        rendered,
        format: file.type || WAV_MIME_TYPE,
      })

      audioBufferCache.set(asset.id, buffer)
      addAsset(asset)
      setSelectedAsset(asset.id)
      return asset
    },
    [addAsset, setSelectedAsset]
  )

  return { createFromPreset, duplicate, createVariations, importFile }
}
