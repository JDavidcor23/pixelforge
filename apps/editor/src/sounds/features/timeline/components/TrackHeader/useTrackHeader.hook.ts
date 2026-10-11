import { useCallback, useRef, useState } from 'react'

import { useSoundsStore } from '@/stores/sounds.store'
import { useSliderGesture } from '../../hooks/useSliderGesture.hook'
import { PERCENT_SCALE } from '@/constants/audio'
import { SOUND_NAME_MAX_LENGTH, VOLUME_RANGE } from '@/constants/sound-library'
import { TRACK_COLOR, TRACK_KIND_ICON } from '@/constants/track-colors'
import type { TimelineTrack } from '@/types/timeline'

export function useTrackHeader(track: TimelineTrack) {
  // Escape (or Enter) unmounts the input; the trailing blur must not commit again.
  const isRenamingRef = useRef(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [draftName, setDraftName] = useState('')

  const toggleMute = useSoundsStore((state) => state.toggleMute)
  const toggleSolo = useSoundsStore((state) => state.toggleSolo)
  const setTrackVolume = useSoundsStore((state) => state.setTrackVolume)
  const renameTrack = useSoundsStore((state) => state.renameTrack)
  const { handleSliderPointerDown } = useSliderGesture()

  const handleToggleMute = useCallback(() => toggleMute(track.id), [toggleMute, track.id])
  const handleToggleSolo = useCallback(() => toggleSolo(track.id), [toggleSolo, track.id])
  const handleVolumeChange = useCallback(
    (volume: number) => setTrackVolume(track.id, volume),
    [setTrackVolume, track.id]
  )

  const handleStartRename = useCallback(() => {
    isRenamingRef.current = true
    setDraftName(track.name)
    setIsRenaming(true)
  }, [track.name])

  /** Ends the inline edit once; `save` commits the draft as ONE undo step. */
  const finishRename = useCallback(
    (save: boolean) => {
      if (!isRenamingRef.current) return
      isRenamingRef.current = false
      setIsRenaming(false)
      if (save) renameTrack(track.id, draftName)
    },
    [renameTrack, track.id, draftName]
  )

  const handleDraftChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => setDraftName(event.target.value),
    []
  )

  const handleRenameKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== 'Enter' && event.key !== 'Escape') return
      event.preventDefault()
      finishRename(event.key === 'Enter')
    },
    [finishRename]
  )

  const handleRenameFocus = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => event.target.select(),
    []
  )

  const handleRenameBlur = useCallback(() => finishRename(true), [finishRename])

  return {
    KindIcon: TRACK_KIND_ICON[track.kind],
    iconClass: TRACK_COLOR[track.kind].ICON,
    volumeRange: VOLUME_RANGE,
    volumeValueText: `${Math.round(track.volume * PERCENT_SCALE)}%`,
    isRenaming,
    draftName,
    nameMaxLength: SOUND_NAME_MAX_LENGTH,
    handleToggleMute,
    handleToggleSolo,
    handleVolumeChange,
    handleSliderPointerDown,
    handleStartRename,
    handleDraftChange,
    handleRenameKeyDown,
    handleRenameFocus,
    handleRenameBlur,
  }
}
