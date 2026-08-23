'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { AudioAsset, ElevenLabsMode, GenerationRecord } from '@/app/editor/types/audio'
import { useSoundsStore } from '@/app/editor/stores/sounds.store'
import { MAX_REFERENCE_FILE_SIZE, SUPPORTED_AUDIO_FORMATS } from '@/app/editor/constants/audio'
import {
  generateSFX,
  generateMusic,
  generateTTS,
  getElevenLabsApiKey,
  setElevenLabsApiKey,
  removeElevenLabsApiKey,
} from '../../services/elevenlabs.service'

const PROMPT_PLACEHOLDERS: Record<ElevenLabsMode, string> = {
  sfx: 'Describe the sound effect... (e.g., "laser gun firing in a sci-fi corridor")',
  music: 'Describe the music... (e.g., "8-bit chiptune boss battle theme, fast tempo")',
  tts: 'Enter text to convert to speech...',
}

export function useAIGeneratePanel() {
  const [mode, setMode] = useState<ElevenLabsMode>('sfx')
  const [prompt, setPrompt] = useState('')
  const [voiceId, setVoiceId] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [hasStoredKey, setHasStoredKey] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [referenceFile, setReferenceFile] = useState<File | null>(null)
  const [referenceError, setReferenceError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)

  const addAsset = useSoundsStore((s) => s.addAsset)
  const addGenerationRecord = useSoundsStore((s) => s.addGenerationRecord)
  const setGeneratedBuffer = useSoundsStore((s) => s.setGeneratedBuffer)

  // Load stored key state on mount
  useEffect(() => {
    const stored = getElevenLabsApiKey()
    if (stored) {
      setHasStoredKey(true)
      setApiKey(stored)
    }
  }, [])

  const handleSaveKey = useCallback(() => {
    if (apiKey.trim()) {
      setElevenLabsApiKey(apiKey.trim())
      setHasStoredKey(true)
    }
  }, [apiKey])

  const handleRemoveKey = useCallback(() => {
    removeElevenLabsApiKey()
    setApiKey('')
    setHasStoredKey(false)
  }, [])

  const handleToggleShowKey = useCallback(() => {
    setShowKey((prev) => !prev)
  }, [])

  const handleModeChange = useCallback((newMode: ElevenLabsMode) => {
    setMode(newMode)
    setError(null)
    setReferenceFile(null)
    setReferenceError(null)
  }, [])

  const handleReferenceFileChange = useCallback((file: File | null) => {
    setReferenceError(null)

    if (!file) {
      setReferenceFile(null)
      return
    }

    if (!SUPPORTED_AUDIO_FORMATS.includes(file.type as typeof SUPPORTED_AUDIO_FORMATS[number])) {
      setReferenceError('Unsupported format. Use WAV, MP3, or OGG.')
      return
    }

    if (file.size > MAX_REFERENCE_FILE_SIZE) {
      setReferenceError('File exceeds 10MB limit.')
      return
    }

    setReferenceFile(file)
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!apiKey.trim() || !prompt.trim()) return
    if (mode === 'tts' && !voiceId.trim()) return

    setIsLoading(true)
    setError(null)

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      let audioBlob: Blob

      switch (mode) {
        case 'sfx':
          audioBlob = await generateSFX(prompt, controller.signal)
          break
        case 'music': {
          const refBlob = referenceFile
            ? new Blob([await referenceFile.arrayBuffer()], { type: referenceFile.type })
            : undefined
          audioBlob = await generateMusic(prompt, refBlob, controller.signal)
          break
        }
        case 'tts':
          audioBlob = await generateTTS(prompt, voiceId, controller.signal)
          break
      }

      // Decode audio blob to AudioBuffer
      const arrayBuffer = await audioBlob.arrayBuffer()
      const audioContext = new AudioContext()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      await audioContext.close()

      // Create asset
      const assetId = crypto.randomUUID()
      const objectUrl = URL.createObjectURL(audioBlob)

      const asset: AudioAsset = {
        id: assetId,
        name: `${mode}-${Date.now()}`,
        tags: [mode === 'tts' ? 'dialog' : mode],
        duration: audioBuffer.duration,
        format: 'audio/mpeg',
        fileSize: audioBlob.size,
        localObjectUrl: objectUrl,
        associatedSpriteIds: [],
        createdAt: new Date().toISOString(),
      }

      const record: GenerationRecord = {
        id: crypto.randomUUID(),
        mode,
        prompt,
        referenceTrackName: referenceFile?.name,
        voiceId: mode === 'tts' ? voiceId : undefined,
        resultAssetId: assetId,
        timestamp: new Date().toISOString(),
      }

      addAsset(asset)
      addGenerationRecord(record)
      setGeneratedBuffer(audioBuffer)
      setPrompt('')
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Generation was cancelled.')
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred.')
      }
      console.error('ElevenLabs generation failed:', err)
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }, [mode, prompt, voiceId, apiKey, referenceFile, addAsset, addGenerationRecord, setGeneratedBuffer])

  const handleCancel = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])

  const canGenerate = Boolean(
    apiKey.trim() &&
    prompt.trim() &&
    (mode !== 'tts' || voiceId.trim())
  )

  const promptPlaceholder = PROMPT_PLACEHOLDERS[mode]

  return {
    mode,
    prompt,
    voiceId,
    apiKey,
    hasStoredKey,
    showKey,
    referenceFile,
    referenceError,
    isLoading,
    error,
    canGenerate,
    promptPlaceholder,
    setPrompt,
    setVoiceId,
    setApiKey,
    handleSaveKey,
    handleRemoveKey,
    handleToggleShowKey,
    handleModeChange,
    handleReferenceFileChange,
    handleGenerate,
    handleCancel,
  }
}
