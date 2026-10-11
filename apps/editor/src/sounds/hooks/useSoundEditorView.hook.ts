import { useCallback } from 'react'

import { useSoundsStore } from '@/stores/sounds.store'

/** Switches the editor pane between the timeline and a single sound. */
export function useSoundEditorView() {
  const setSelectedAsset = useSoundsStore((state) => state.setSelectedAsset)
  const setEditorView = useSoundsStore((state) => state.setEditorView)

  const openSound = useCallback(
    (assetId: string) => {
      setSelectedAsset(assetId)
      setEditorView('sound')
    },
    [setSelectedAsset, setEditorView]
  )

  const backToTimeline = useCallback(() => setEditorView('timeline'), [setEditorView])

  return { openSound, backToTimeline }
}
