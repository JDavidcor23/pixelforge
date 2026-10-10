import { useCallback, useEffect, useState } from 'react'

import { audioEngine } from '@/lib/audio-engine'

export function useSoundEditorLayout() {
  const [showAudioOverlay, setShowAudioOverlay] = useState(false)

  useEffect(() => {
    setShowAudioOverlay(audioEngine.isSuspended())
  }, [])

  const handleEnableAudio = useCallback(async () => {
    await audioEngine.resume()
    setShowAudioOverlay(false)
  }, [])

  return { showAudioOverlay, handleEnableAudio }
}
