import { useEffect } from 'react'

import { useSoundsStore } from '@/stores/sounds.store'
import { useSynthAssetSync } from '../../hooks/useSynthAssetSync.hook'
import { audioBufferCache } from '@/lib/audio-buffer-cache'
import { computePeaks } from '@/lib/audio-peaks'
import { getAssetSource } from '@/lib/sound-assets'
import { WAVE_PEAK_COUNT } from '@/constants/sound-library'

export function useSoundDetail() {
  const assets = useSoundsStore((state) => state.assets)
  const selectedAssetId = useSoundsStore((state) => state.selectedAssetId)
  const generationHistory = useSoundsStore((state) => state.generationHistory)
  const setSelectedAsset = useSoundsStore((state) => state.setSelectedAsset)
  const updateAsset = useSoundsStore((state) => state.updateAsset)

  const asset = assets.find((item) => item.id === selectedAssetId) ?? null
  const source = asset ? getAssetSource(asset, generationHistory) : null
  const isSynth = source === 'synth' && Boolean(asset?.synthParams)

  useSynthAssetSync(asset, isSynth)

  // Always show something when the library has sounds.
  useEffect(() => {
    if (!asset && assets.length > 0) setSelectedAsset(assets[0].id)
  }, [asset, assets, setSelectedAsset])

  // Legacy / imported assets may arrive without peaks: decode once and fill them in.
  const assetId = asset?.id
  const hasPeaks = Boolean(asset?.peaks)
  useEffect(() => {
    if (!asset || hasPeaks) return
    let cancelled = false
    void audioBufferCache.load(asset).then((buffer) => {
      if (cancelled || !buffer) return
      updateAsset(asset.id, {
        peaks: computePeaks(buffer, WAVE_PEAK_COUNT),
        duration: asset.duration > 0 ? asset.duration : buffer.duration,
      })
    })
    return () => {
      cancelled = true
    }
    // Keyed on identity + whether peaks exist, not on every asset field.
  }, [assetId, hasPeaks])

  return { asset, source, isSynth }
}
