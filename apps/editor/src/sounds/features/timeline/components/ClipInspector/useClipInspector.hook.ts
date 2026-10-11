import { useCallback } from 'react'

import { useSoundsStore } from '@/stores/sounds.store'
import { useSliderGesture } from '../../hooks/useSliderGesture.hook'
import { formatSeconds } from '@/lib/sound-assets'
import { isTimeInsideClip } from '@/lib/timeline-ops'
import {
  GAIN_DB_MAX,
  GAIN_DB_MIN,
  MAX_FADE_RATIO,
  SPEED_MAX,
  SPEED_MIN,
} from '@/constants/timeline'
import { CLIP_INSPECTOR } from '@/constants/timeline-view'
import type { TimelineClip, TimelineClipPatch } from '@/types/timeline'

const formatGain = (db: number): string => `${db > 0 ? '+' : ''}${db.toFixed(CLIP_INSPECTOR.GAIN_DECIMALS)} dB`
const formatSpeed = (speed: number): string => `${speed.toFixed(CLIP_INSPECTOR.SPEED_DECIMALS)}×`
const formatFade = (seconds: number): string => `${formatSeconds(seconds)}s`

function buildSliders(clip: TimelineClip, update: (patch: TimelineClipPatch) => void) {
  const maxFade = clip.duration * MAX_FADE_RATIO
  return [
    {
      key: 'gain',
      label: 'Volume',
      lo: 'Quiet',
      hi: 'Loud',
      value: clip.gainDb,
      valueLabel: formatGain(clip.gainDb),
      min: GAIN_DB_MIN,
      max: GAIN_DB_MAX,
      step: CLIP_INSPECTOR.GAIN_STEP_DB,
      onChange: (gainDb: number) => update({ gainDb }),
    },
    {
      key: 'speed',
      label: 'Speed',
      lo: 'Slower',
      hi: 'Faster',
      value: clip.speed,
      valueLabel: formatSpeed(clip.speed),
      min: SPEED_MIN,
      max: SPEED_MAX,
      step: CLIP_INSPECTOR.SPEED_STEP,
      onChange: (speed: number) => update({ speed }),
    },
    {
      key: 'fade-in',
      label: 'Fade in',
      lo: 'None',
      hi: 'Slow',
      value: clip.fadeIn,
      valueLabel: formatFade(clip.fadeIn),
      min: 0,
      max: maxFade,
      step: CLIP_INSPECTOR.FADE_STEP_S,
      onChange: (fadeIn: number) => update({ fadeIn }),
    },
    {
      key: 'fade-out',
      label: 'Fade out',
      lo: 'None',
      hi: 'Slow',
      value: clip.fadeOut,
      valueLabel: formatFade(clip.fadeOut),
      min: 0,
      max: maxFade,
      step: CLIP_INSPECTOR.FADE_STEP_S,
      onChange: (fadeOut: number) => update({ fadeOut }),
    },
  ]
}

export function useClipInspector() {
  const clip = useSoundsStore((state) => state.clips.find((item) => item.id === state.selectedClipId) ?? null)
  const trackName = useSoundsStore((state) =>
    clip ? (state.tracks.find((track) => track.id === clip.trackId)?.name ?? '') : ''
  )
  const assetName = useSoundsStore((state) =>
    clip ? (state.assets.find((asset) => asset.id === clip.assetId)?.name ?? '') : ''
  )
  const canSplitHere = useSoundsStore((state) => (clip ? isTimeInsideClip(clip, state.playheadTime) : false))
  const updateClip = useSoundsStore((state) => state.updateClip)
  const split = useSoundsStore((state) => state.split)
  const duplicate = useSoundsStore((state) => state.duplicate)
  const deleteClip = useSoundsStore((state) => state.deleteClip)
  const { handleSliderPointerDown } = useSliderGesture()

  const clipId = clip?.id ?? null

  const update = useCallback(
    (patch: TimelineClipPatch) => {
      if (clipId) updateClip(clipId, patch)
    },
    [clipId, updateClip]
  )

  const handleSplit = useCallback(() => {
    if (clipId) split(clipId, useSoundsStore.getState().playheadTime)
  }, [clipId, split])

  const handleDuplicate = useCallback(() => {
    if (clipId) duplicate(clipId)
  }, [clipId, duplicate])

  const handleDelete = useCallback(() => {
    if (clipId) deleteClip(clipId)
  }, [clipId, deleteClip])

  return {
    hasClip: clip !== null,
    assetName,
    meta: clip
      ? `${trackName} track · starts ${formatSeconds(clip.start)}s · ${formatSeconds(clip.duration)}s long`
      : '',
    sliders: clip ? buildSliders(clip, update) : [],
    canSplitHere,
    handleSliderPointerDown,
    handleSplit,
    handleDuplicate,
    handleDelete,
  }
}
