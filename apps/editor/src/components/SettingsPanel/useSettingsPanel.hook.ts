import { useState, useCallback, useEffect, useId, useRef } from 'react'
import type { KeyboardEvent, MouseEvent, RefObject } from 'react'
import { useEditorPrefsStore } from '@/stores/prefs.store'
import { useAuthStore } from '@/stores/auth.store'
import { useEditorUIStore } from '@/stores/ui.store'
import {
  getElevenLabsApiKey,
  setElevenLabsApiKey,
  removeElevenLabsApiKey,
} from '@/sounds/features/ai-generate/services/elevenlabs.service'
import { API_KEY_PROVIDER, API_KEY_SAVED_FEEDBACK_MS } from '@/constants/settings'
import type { ApiKeyProvider } from '@/types/settings'

interface UseSettingsPanelResult {
  retroKey: string
  setRetroKey: (value: string) => void
  showRetroKey: boolean
  toggleShowRetroKey: () => void
  hasRetroKey: boolean
  isRetroSaved: boolean
  handleSaveRetroKey: () => void
  handleRemoveRetroKey: () => void
  elevenLabsKey: string
  setElevenLabsKey: (value: string) => void
  showElevenLabsKey: boolean
  toggleShowElevenLabsKey: () => void
  hasElevenLabsKey: boolean
  isElevenLabsSaved: boolean
  handleSaveElevenLabsKey: () => void
  handleRemoveElevenLabsKey: () => void
  handleClose: () => void
  dialogRef: RefObject<HTMLDivElement | null>
  titleId: string
  handleKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void
  handlePanelClick: (event: MouseEvent<HTMLDivElement>) => void
  /** Account section (editor-auth change) only shows while signed in — no account, no cloud data to delete. */
  isSignedIn: boolean
  handleDeleteAccountClick: () => void
}

export const useSettingsPanel = (onClose: () => void): UseSettingsPanelResult => {
  const retroDiffusionApiKey = useEditorPrefsStore((s) => s.retroDiffusionApiKey)
  const setRetroDiffusionApiKey = useEditorPrefsStore((s) => s.setRetroDiffusionApiKey)
  const authStatus = useAuthStore((s) => s.status)
  const openDeleteAccountDialog = useEditorUIStore((s) => s.openDeleteAccountDialog)

  const [retroKey, setRetroKey] = useState(retroDiffusionApiKey ?? '')
  const [elevenLabsKey, setElevenLabsKey] = useState('')
  const [hasElevenLabsKey, setHasElevenLabsKey] = useState(false)
  const [showRetroKey, setShowRetroKey] = useState(false)
  const [showElevenLabsKey, setShowElevenLabsKey] = useState(false)
  const [savedFeedback, setSavedFeedback] = useState<ApiKeyProvider | null>(null)
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  useEffect(() => {
    const stored = getElevenLabsApiKey()
    if (stored) setElevenLabsKey(stored)
    setHasElevenLabsKey(!!stored)
  }, [])

  useEffect(() => {
    setRetroKey(retroDiffusionApiKey ?? '')
  }, [retroDiffusionApiKey])

  // Move focus into the dialog on open so Escape and Tab land inside it.
  useEffect(() => {
    dialogRef.current?.focus()
  }, [])

  // Clear any pending "saved" feedback timer on unmount.
  useEffect(
    () => () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    },
    []
  )

  const flashSaved = useCallback((provider: ApiKeyProvider) => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    setSavedFeedback(provider)
    feedbackTimerRef.current = setTimeout(() => {
      setSavedFeedback(null)
      feedbackTimerRef.current = null
    }, API_KEY_SAVED_FEEDBACK_MS)
  }, [])

  const handleSaveRetroKey = useCallback(() => {
    const trimmed = retroKey.trim()
    setRetroDiffusionApiKey(trimmed || null)
    flashSaved(API_KEY_PROVIDER.RETRO_DIFFUSION)
  }, [retroKey, setRetroDiffusionApiKey, flashSaved])

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
    setHasElevenLabsKey(!!trimmed)
    flashSaved(API_KEY_PROVIDER.ELEVENLABS)
  }, [elevenLabsKey, flashSaved])

  const handleRemoveElevenLabsKey = useCallback(() => {
    setElevenLabsKey('')
    removeElevenLabsApiKey()
    setHasElevenLabsKey(false)
  }, [])

  const toggleShowRetroKey = useCallback(() => setShowRetroKey((v) => !v), [])
  const toggleShowElevenLabsKey = useCallback(() => setShowElevenLabsKey((v) => !v), [])

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      onClose()
    },
    [onClose]
  )

  const handlePanelClick = useCallback((event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation()
  }, [])

  // Settings closes first so the Delete dialog never stacks on top of it.
  const handleDeleteAccountClick = useCallback(() => {
    onClose()
    openDeleteAccountDialog()
  }, [onClose, openDeleteAccountDialog])

  return {
    retroKey,
    setRetroKey,
    showRetroKey,
    toggleShowRetroKey,
    hasRetroKey: !!retroDiffusionApiKey,
    isRetroSaved: savedFeedback === API_KEY_PROVIDER.RETRO_DIFFUSION,
    handleSaveRetroKey,
    handleRemoveRetroKey,
    elevenLabsKey,
    setElevenLabsKey,
    showElevenLabsKey,
    toggleShowElevenLabsKey,
    hasElevenLabsKey,
    isElevenLabsSaved: savedFeedback === API_KEY_PROVIDER.ELEVENLABS,
    handleSaveElevenLabsKey,
    handleRemoveElevenLabsKey,
    handleClose,
    dialogRef,
    titleId,
    handleKeyDown,
    handlePanelClick,
    isSignedIn: authStatus === 'signed-in',
    handleDeleteAccountClick,
  }
}
