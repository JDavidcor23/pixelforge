import { useState, useEffect, useCallback } from 'react'
import { audioEngine } from '@/app/editor/lib/audio-engine'

type LeftTab = 'synth' | 'ai'

export function useSoundEditorLayout() {
  const [activeLeftTab, setActiveLeftTab] = useState<LeftTab>('synth')
  const [showAudioOverlay, setShowAudioOverlay] = useState(false)

  useEffect(() => {
    const suspended = audioEngine.isSuspended()
    setShowAudioOverlay(suspended)
  }, [])

  const handleEnableAudio = useCallback(async () => {
    await audioEngine.resume()
    setShowAudioOverlay(false)
  }, [])

  const handleTabChange = useCallback((tab: LeftTab) => {
    setActiveLeftTab(tab)
  }, [])

  return {
    activeLeftTab,
    showAudioOverlay,
    handleEnableAudio,
    handleTabChange,
  }
}
