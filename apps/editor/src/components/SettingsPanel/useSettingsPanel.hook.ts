'use client'

import { useState, useCallback, useEffect } from 'react'
import { useEditorPrefsStore } from '@/app/editor/stores/prefs.store'
import {
  getElevenLabsApiKey,
  setElevenLabsApiKey,
  removeElevenLabsApiKey,
} from '@/app/editor/sounds/features/ai-generate/services/elevenlabs.service'

export const useSettingsPanel = (onClose: () => void) => {
  const retroDiffusionApiKey = useEditorPrefsStore((s) => s.retroDiffusionApiKey)
  const setRetroDiffusionApiKey = useEditorPrefsStore((s) => s.setRetroDiffusionApiKey)

  const [retroKey, setRetroKey] = useState(retroDiffusionApiKey ?? '')
  const [elevenLabsKey, setElevenLabsKey] = useState('')
  const [showRetroKey, setShowRetroKey] = useState(false)
  const [showElevenLabsKey, setShowElevenLabsKey] = useState(false)
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null)

  useEffect(() => {
    const stored = getElevenLabsApiKey()
    if (stored) setElevenLabsKey(stored)
  }, [])

  useEffect(() => {
    setRetroKey(retroDiffusionApiKey ?? '')
  }, [retroDiffusionApiKey])

  const handleSaveRetroKey = useCallback(() => {
    const trimmed = retroKey.trim()
    setRetroDiffusionApiKey(trimmed || null)
    setSavedFeedback('retro')
    setTimeout(() => setSavedFeedback(null), 2000)
  }, [retroKey, setRetroDiffusionApiKey])

  const handleRemoveRetroKey = useCallback(() => {
    setRetroKey('')
    setRetroDiffusionApiKey(null)
  }, [setRetroDiffusionApiKey])

  const handleSaveElevenLabsKey = useCallback(() => {
    const trimmed = elevenLabsKey.trim()
    if (trimmed) {
      setElevenLabsApiKey(trimmed)
    } else {
      removeElevenLabsApiKey()
    }
    setSavedFeedback('elevenlabs')
    setTimeout(() => setSavedFeedback(null), 2000)
  }, [elevenLabsKey])

  const handleRemoveElevenLabsKey = useCallback(() => {
    setElevenLabsKey('')
    removeElevenLabsApiKey()
  }, [])

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  return {
    retroKey,
    setRetroKey,
    showRetroKey,
    toggleShowRetroKey: () => setShowRetroKey((v) => !v),
    hasRetroKey: !!retroDiffusionApiKey,
    handleSaveRetroKey,
    handleRemoveRetroKey,
    elevenLabsKey,
    setElevenLabsKey,
    showElevenLabsKey,
    toggleShowElevenLabsKey: () => setShowElevenLabsKey((v) => !v),
    hasElevenLabsKey: !!getElevenLabsApiKey(),
    handleSaveElevenLabsKey,
    handleRemoveElevenLabsKey,
    savedFeedback,
    handleClose,
  }
}
