import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { FocusEvent } from 'react'

import { useSoundsStore } from '@/stores/sounds.store'
import { useCreateSound } from '@/sounds/hooks/useCreateSound.hook'
import { audioEngine } from '@/lib/audio-engine'
import { getPresetById } from '@/lib/audio-presets'
import {
  NEW_SOUND_AUTOFOCUS,
  PRESET_PREVIEW_DEBOUNCE_MS,
  PRESET_PREVIEW_DURATION_S,
  PRESET_TILES,
} from '@/constants/sound-library'

export function usePresetSection() {
  const headingId = useId()
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [creatingPresetId, setCreatingPresetId] = useState<string | null>(null)

  const closeNewSound = useSoundsStore((state) => state.closeNewSound)
  const { createFromPreset } = useCreateSound()

  const cancelPreview = useCallback(() => {
    if (previewTimerRef.current !== null) {
      clearTimeout(previewTimerRef.current)
      previewTimerRef.current = null
    }
  }, [])

  const stopPreview = useCallback(() => {
    cancelPreview()
    audioEngine.stopSynth()
  }, [cancelPreview])

  const startPreview = useCallback(
    (presetId: string) => {
      cancelPreview()
      previewTimerRef.current = setTimeout(() => {
        const preset = getPresetById(presetId)
        if (!preset) return
        void audioEngine.resume()
        audioEngine.playSynth(preset.params, PRESET_PREVIEW_DURATION_S)
      }, PRESET_PREVIEW_DEBOUNCE_MS)
    },
    [cancelPreview]
  )

  const handleCreate = useCallback(
    async (presetId: string) => {
      stopPreview()
      setCreatingPresetId(presetId)
      try {
        await createFromPreset(presetId)
        closeNewSound()
      } catch (error) {
        console.error('Failed to create sound from preset:', error)
      } finally {
        setCreatingPresetId(null)
      }
    },
    [stopPreview, createFromPreset, closeNewSound]
  )

  useEffect(() => stopPreview, [stopPreview])

  const tiles = PRESET_TILES.map((tile, index) => ({
    ...tile,
    // The first tile takes focus when the popover opens on the presets section.
    autofocus: index === 0 ? NEW_SOUND_AUTOFOCUS.presets : undefined,
    isCreating: creatingPresetId === tile.presetId,
    onPreview: () => startPreview(tile.presetId),
    // Keyboard focus previews; the programmatic focus on open does not.
    onFocus: (event: FocusEvent<HTMLButtonElement>) => {
      if (event.currentTarget.matches(':focus-visible')) startPreview(tile.presetId)
    },
    onCreate: () => void handleCreate(tile.presetId),
  }))

  return { headingId, tiles, isBusy: creatingPresetId !== null, stopPreview }
}
