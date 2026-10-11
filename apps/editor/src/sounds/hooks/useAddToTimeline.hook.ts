import { useCallback } from 'react'

import { useSoundsStore } from '@/stores/sounds.store'
import { getAssetKind } from '@/lib/sound-assets'
import type { AddClipOptions } from '@/types/timeline'

/**
 * The one way a library sound lands on the timeline. Without a target track it
 * goes on the first track of the sound's kind — creating that track if the
 * user removed or never had one — and the whole thing is ONE undo step.
 */
export function useAddToTimeline() {
  const addClip = useSoundsStore((state) => state.addClip)
  const addTrack = useSoundsStore((state) => state.addTrack)
  const beginGesture = useSoundsStore((state) => state.beginGesture)
  const endGesture = useSoundsStore((state) => state.endGesture)
  const setEditorView = useSoundsStore((state) => state.setEditorView)

  const addToTimeline = useCallback(
    (assetId: string, options: AddClipOptions = {}): string | null => {
      const { assets, tracks } = useSoundsStore.getState()
      const asset = assets.find((item) => item.id === assetId)
      if (!asset) return null

      beginGesture()
      let trackId = options.trackId
      if (!trackId) {
        const kind = getAssetKind(asset)
        trackId = tracks.find((track) => track.kind === kind)?.id ?? addTrack(kind)
      }
      const clipId = addClip(assetId, { ...options, trackId })
      endGesture()
      setEditorView('timeline')
      return clipId
    },
    [addClip, addTrack, beginGesture, endGesture, setEditorView]
  )

  return { addToTimeline }
}
