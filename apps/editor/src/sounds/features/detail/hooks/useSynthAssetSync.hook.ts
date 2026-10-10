import { useEffect, useRef } from 'react'

import { useSoundsStore } from '@/stores/sounds.store'
import { audioBufferCache } from '@/lib/audio-buffer-cache'
import { audioEngine } from '@/lib/audio-engine'
import { areSynthParamsEqual, releaseObjectUrl, renderSynthSound } from '@/lib/sound-assets'
import { TWEAK_REGENERATE_DEBOUNCE_MS } from '@/constants/sound-library'
import type { AudioAsset } from '@/types/audio'

/**
 * Two-way bridge between the selected synth asset and the store's editable
 * `synthParams` (shared by the Tweak sliders and the Advanced controls):
 *
 *  1. Selecting a synth asset loads its recipe into `synthParams`.
 *  2. Editing `synthParams` writes the recipe back to the asset at once and,
 *     debounced, re-renders the audio (buffer, URL, peaks, duration) and
 *     plays a short preview.
 *
 * `loadedIdRef` guards step 2 so a freshly loaded recipe is never written into
 * the wrong asset during the render where the selection changes.
 */
export function useSynthAssetSync(asset: AudioAsset | null, isSynth: boolean) {
  const loadedIdRef = useRef<string | null>(null)
  // Per-asset debounce timers and request counters: switching selection must
  // not cancel (or invalidate) a re-render still pending for the previous asset.
  const timersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const requestsRef = useRef(new Map<string, number>())

  const synthParams = useSoundsStore((state) => state.synthParams)
  const loadSynthParams = useSoundsStore((state) => state.loadSynthParams)
  const updateAsset = useSoundsStore((state) => state.updateAsset)
  const setIsGenerating = useSoundsStore((state) => state.setIsGenerating)

  const assetId = asset?.id ?? null
  const assetParams = asset?.synthParams

  // 1. Selection → store
  useEffect(() => {
    if (isSynth && assetId && assetParams) {
      loadedIdRef.current = assetId
      loadSynthParams(assetParams)
    } else {
      loadedIdRef.current = null
    }
    // Only a new selection reloads; recipe edits flow the other way.
  }, [assetId, isSynth])

  // 2. Store → asset (+ debounced re-render of the audio)
  useEffect(() => {
    if (!assetId || !assetParams || loadedIdRef.current !== assetId) return
    if (areSynthParamsEqual(assetParams, synthParams)) return

    updateAsset(assetId, { synthParams })

    const timers = timersRef.current
    const requests = requestsRef.current
    const pending = timers.get(assetId)
    if (pending !== undefined) clearTimeout(pending)
    const request = (requests.get(assetId) ?? 0) + 1
    requests.set(assetId, request)
    const isLatest = () => requests.get(assetId) === request

    // Timers only touch the store and the buffer cache, so they are allowed
    // to outlive this component (e.g. navigating away mid-debounce).
    timers.set(
      assetId,
      setTimeout(async () => {
        timers.delete(assetId)
        setIsGenerating(true)
        try {
          const rendered = await renderSynthSound(synthParams)
          const current = useSoundsStore.getState().assets.find((item) => item.id === assetId)
          // Superseded by a newer edit, or the asset was deleted meanwhile.
          if (!isLatest() || !current) {
            URL.revokeObjectURL(rendered.url)
            return
          }
          audioBufferCache.set(assetId, rendered.buffer)
          updateAsset(assetId, {
            duration: rendered.duration,
            fileSize: rendered.blob.size,
            localObjectUrl: rendered.url,
            peaks: rendered.peaks,
          })
          releaseObjectUrl(current.localObjectUrl, useSoundsStore.getState().assets)
          // Preview only if the user is still on this sound.
          if (loadedIdRef.current === assetId) {
            void audioEngine.resume()
            audioEngine.playSynth(synthParams)
          }
        } catch (error) {
          console.error('Failed to re-render synth sound:', error)
        } finally {
          if (isLatest()) setIsGenerating(false)
        }
      }, TWEAK_REGENERATE_DEBOUNCE_MS)
    )
    // Runs on recipe edits only; see step 1 for selection changes.
  }, [synthParams])
}
