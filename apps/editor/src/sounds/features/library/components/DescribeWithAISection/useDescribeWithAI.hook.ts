import { useCallback, useId } from 'react'

import { useSoundsStore } from '@/stores/sounds.store'
import { useElevenLabsConnection } from '@/sounds/hooks/useElevenLabsConnection.hook'
import { useGenerateSound } from '@/sounds/hooks/useGenerateSound.hook'
import { AI_KIND_OPTIONS, NEW_SOUND_AUTOFOCUS } from '@/constants/sound-library'
import type { ElevenLabsMode } from '@/types/audio'

const NEXT_KEYS = ['ArrowRight', 'ArrowDown']
const PREVIOUS_KEYS = ['ArrowLeft', 'ArrowUp']

export function useDescribeWithAI() {
  const headingId = useId()
  const errorId = useId()

  const prompt = useSoundsStore((state) => state.newSoundPrompt)
  const mode = useSoundsStore((state) => state.newSoundMode)
  const generationError = useSoundsStore((state) => state.generationError)
  const isGenerating = useSoundsStore((state) => state.pendingGenerations.length > 0)
  const setPrompt = useSoundsStore((state) => state.setNewSoundPrompt)
  const setMode = useSoundsStore((state) => state.setNewSoundMode)
  const closeNewSound = useSoundsStore((state) => state.closeNewSound)

  const { isConnected, openSettings } = useElevenLabsConnection()
  const { generate } = useGenerateSound()

  const canGenerate = isConnected && prompt.trim().length > 0 && !isGenerating

  const kinds = AI_KIND_OPTIONS.map((option) => ({
    ...option,
    isChecked: option.mode === mode,
    onSelect: () => setMode(option.mode),
  }))

  // Radiogroup arrow keys: move the checked option and focus with it.
  const handleKindKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const step = NEXT_KEYS.includes(event.key) ? 1 : PREVIOUS_KEYS.includes(event.key) ? -1 : 0
      if (step === 0) return
      event.preventDefault()

      const current = AI_KIND_OPTIONS.findIndex((option) => option.mode === mode)
      const nextIndex = (current + step + AI_KIND_OPTIONS.length) % AI_KIND_OPTIONS.length
      const nextMode: ElevenLabsMode = AI_KIND_OPTIONS[nextIndex].mode
      setMode(nextMode)
      event.currentTarget
        .querySelector<HTMLElement>(`[data-mode="${nextMode}"]`)
        ?.focus()
    },
    [mode, setMode]
  )

  const handlePromptChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => setPrompt(event.target.value),
    [setPrompt]
  )

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (!canGenerate) return
      void generate(mode, prompt)
    },
    [canGenerate, generate, mode, prompt]
  )

  const handleOpenSettings = useCallback(() => {
    closeNewSound()
    openSettings()
  }, [closeNewSound, openSettings])

  return {
    headingId,
    errorId,
    autofocus: NEW_SOUND_AUTOFOCUS.ai,
    prompt,
    kinds,
    isConnected,
    isGenerating,
    canGenerate,
    generationError,
    handleKindKeyDown,
    handlePromptChange,
    handleSubmit,
    handleOpenSettings,
  }
}
