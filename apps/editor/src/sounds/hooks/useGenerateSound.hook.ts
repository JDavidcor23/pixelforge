import { useCallback } from 'react'

import { useSoundsStore } from '@/stores/sounds.store'
import { audioBufferCache } from '@/lib/audio-buffer-cache'
import { audioEngine } from '@/lib/audio-engine'
import { decodeAudioBlob } from '@/lib/audio-encoder'
import { buildAsset, buildUniqueName, describeSound, slugify } from '@/lib/sound-assets'
import {
  generateMusic,
  generateSFX,
  generateTTS,
} from '@/sounds/features/ai-generate'
import {
  ELEVENLABS_DEFAULT_VOICE_ID,
  MODE_TO_TAG,
  MPEG_MIME_TYPE,
  PROMPT_SLUG_MAX_LENGTH,
  SOUND_LIBRARY_ERRORS,
} from '@/constants/sound-library'
import type { ElevenLabsMode, GenerationRecord } from '@/types/audio'

function requestAudio(mode: ElevenLabsMode, prompt: string): Promise<Blob> {
  switch (mode) {
    case 'sfx':
      return generateSFX(prompt)
    case 'music':
      return generateMusic(prompt)
    case 'tts':
      return generateTTS(prompt, ELEVENLABS_DEFAULT_VOICE_ID)
  }
}

/**
 * AI generation through ElevenLabs. The popover closes immediately and a
 * pending row stands in for the sound; everything after the await only talks
 * to the store, so it is safe for the calling component to unmount meanwhile.
 */
export function useGenerateSound() {
  const addAsset = useSoundsStore((state) => state.addAsset)
  const addGenerationRecord = useSoundsStore((state) => state.addGenerationRecord)
  const setSelectedAsset = useSoundsStore((state) => state.setSelectedAsset)
  const addPendingGeneration = useSoundsStore((state) => state.addPendingGeneration)
  const removePendingGeneration = useSoundsStore((state) => state.removePendingGeneration)
  const setGenerationError = useSoundsStore((state) => state.setGenerationError)
  const setNewSoundPrompt = useSoundsStore((state) => state.setNewSoundPrompt)
  const openNewSound = useSoundsStore((state) => state.openNewSound)
  const closeNewSound = useSoundsStore((state) => state.closeNewSound)

  const generate = useCallback(
    async (mode: ElevenLabsMode, rawPrompt: string): Promise<void> => {
      const prompt = rawPrompt.trim()
      if (!prompt) return

      const pendingId = crypto.randomUUID()
      setGenerationError(null)
      addPendingGeneration({ id: pendingId, prompt, mode })
      closeNewSound()

      try {
        const blob = await requestAudio(mode, prompt)
        const buffer = await decodeAudioBlob(blob, audioEngine.getContext())
        const rendered = describeSound(buffer, blob)
        // Names read after the await: other sounds may have landed meanwhile.
        const existingNames = useSoundsStore.getState().assets.map((item) => item.name)
        const asset = buildAsset({
          name: buildUniqueName(slugify(prompt, PROMPT_SLUG_MAX_LENGTH), existingNames),
          tags: [MODE_TO_TAG[mode]],
          source: 'ai',
          rendered,
          format: blob.type || MPEG_MIME_TYPE,
          prompt,
        })
        const record: GenerationRecord = {
          id: crypto.randomUUID(),
          mode,
          prompt,
          voiceId: mode === 'tts' ? ELEVENLABS_DEFAULT_VOICE_ID : undefined,
          resultAssetId: asset.id,
          timestamp: new Date().toISOString(),
        }

        audioBufferCache.set(asset.id, buffer)
        addAsset(asset)
        addGenerationRecord(record)
        setSelectedAsset(asset.id)
        setNewSoundPrompt('')
      } catch (error) {
        console.error('ElevenLabs generation failed:', error)
        openNewSound({ section: 'ai', prompt, mode })
        setGenerationError(SOUND_LIBRARY_ERRORS.GENERATION_FAILED)
      } finally {
        removePendingGeneration(pendingId)
      }
    },
    [
      addAsset,
      addGenerationRecord,
      setSelectedAsset,
      addPendingGeneration,
      removePendingGeneration,
      setGenerationError,
      setNewSoundPrompt,
      openNewSound,
      closeNewSound,
    ]
  )

  return { generate }
}
