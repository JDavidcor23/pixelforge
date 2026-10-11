import { useCallback, useEffect, useState } from 'react'

import { useSoundsStore } from '@/stores/sounds.store'
import { useSoundEditorView } from '@/sounds/hooks/useSoundEditorView.hook'
import { audioEngine } from '@/lib/audio-engine'

export function useSoundEditorLayout() {
  const [showAudioOverlay, setShowAudioOverlay] = useState(false)
  const editorView = useSoundsStore((state) => state.editorView)
  const { backToTimeline } = useSoundEditorView()

  useEffect(() => {
    setShowAudioOverlay(audioEngine.isSuspended())
  }, [])

  const handleEnableAudio = useCallback(async () => {
    await audioEngine.resume()
    setShowAudioOverlay(false)
  }, [])

  return {
    showAudioOverlay,
    isTimelineView: editorView === 'timeline',
    handleEnableAudio,
    handleBackToTimeline: backToTimeline,
  }
}
