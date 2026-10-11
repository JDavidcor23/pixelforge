import { useCallback, useState } from 'react'

import { useSoundsStore } from '@/stores/sounds.store'
import { encodeWav } from '@/lib/audio-encoder'
import { audioEngine } from '@/lib/audio-engine'
import { downloadBlob } from '@/lib/export-utils'
import { loadClipBuffers } from '@/lib/timeline-buffers'
import { renderMix } from '@/lib/timeline-player'
import { WAV_EXTENSION } from '@/constants/sound-library'
import { MIX_EXPORT, TIMELINE_ERRORS } from '@/constants/timeline-view'

/** Renders the whole timeline offline and downloads it as `<projectName>.wav`. */
export function useMixExport() {
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const hasClips = useSoundsStore((state) => state.clips.length > 0)

  const handleExport = useCallback(async () => {
    setExportError(null)
    setIsExporting(true)
    try {
      const { clips, tracks, assets, projectName } = useSoundsStore.getState()
      const { buffers, missing } = await loadClipBuffers(clips, assets)
      if (missing.length > 0) {
        setExportError(TIMELINE_ERRORS.MISSING_AUDIO)
        return
      }
      const sampleRate = audioEngine.getContext().sampleRate
      const mix = await renderMix(
        { clips, tracks, buffers, masterVolume: MIX_EXPORT.MASTER_VOLUME },
        sampleRate
      )
      downloadBlob(encodeWav(mix), `${projectName}${WAV_EXTENSION}`)
    } catch (error) {
      console.error('Failed to export mix:', error)
      setExportError(TIMELINE_ERRORS.EXPORT_FAILED)
    } finally {
      setIsExporting(false)
    }
  }, [])

  return { isExporting, exportError, canExport: hasClips && !isExporting, handleExport }
}
