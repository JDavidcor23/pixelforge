import { useCallback, useEffect, useRef, useState } from 'react'

import { useSoundsStore } from '@/stores/sounds.store'
import { clipEnd, collectSnapEdges, snapThresholdSeconds, snapTime } from '@/lib/timeline-ops'
import { clipAriaLabel, snapClipMove, timeToX } from '@/lib/timeline-view'
import { SNAP_GRID_SECONDS } from '@/constants/timeline'
import { TIMELINE_LAYOUT } from '@/constants/timeline-view'
import { TRACK_COLOR } from '@/constants/track-colors'
import type { SnapOptions, TimelineClip, TimelineTrack } from '@/types/timeline'
import type { ClipDragMode } from '@/types/timeline-view'

interface DragOrigin {
  mode: ClipDragMode
  pointerId: number
  pointerX: number
  pointerY: number
  start: number
  end: number
  trackIndex: number
  hasMoved: boolean
}

interface DragView {
  mode: ClipDragMode
  /** Timeline second of the edge that snapped, or null. */
  guide: number | null
}

interface UseTimelineClipParams {
  clip: TimelineClip
  track: TimelineTrack
  trackIndex: number
  layerRef: React.RefObject<HTMLDivElement | null>
}

/** Snap settings for a clip being edited, read from the live store. */
function snapOptionsFor(clipId: string): SnapOptions | null {
  const { snapEnabled, clips, playheadTime, pxPerSecond } = useSoundsStore.getState()
  if (!snapEnabled) return null
  return {
    grid: SNAP_GRID_SECONDS,
    edges: collectSnapEdges(clips, clipId, [playheadTime]),
    threshold: snapThresholdSeconds(pxPerSecond),
  }
}

/** Snaps one edge time; returns the time and, if it snapped, the guide. */
function snapEdge(time: number, options: SnapOptions | null): { time: number; guide: number | null } {
  if (!options) return { time, guide: null }
  const snapped = snapTime(time, options)
  return { time: snapped, guide: snapped === time ? null : snapped }
}

/**
 * Pointer editing of one clip. Drag the body to move it (also across tracks),
 * drag an edge to trim; each drag is ONE undo step (gesture) and Escape
 * mid-drag reverts it.
 */
export function useTimelineClip({ clip, track, trackIndex, layerRef }: UseTimelineClipParams) {
  const originRef = useRef<DragOrigin | null>(null)
  const [drag, setDrag] = useState<DragView | null>(null)

  const asset = useSoundsStore((state) => state.assets.find((item) => item.id === clip.assetId))
  const isSelected = useSoundsStore((state) => state.selectedClipId === clip.id)
  const pxPerSecond = useSoundsStore((state) => state.pxPerSecond)
  const selectClip = useSoundsStore((state) => state.selectClip)
  const moveClip = useSoundsStore((state) => state.moveClip)
  const trimStart = useSoundsStore((state) => state.trimStart)
  const trimEnd = useSoundsStore((state) => state.trimEnd)
  const beginGesture = useSoundsStore((state) => state.beginGesture)
  const endGesture = useSoundsStore((state) => state.endGesture)
  const cancelGesture = useSoundsStore((state) => state.cancelGesture)

  const finishDrag = useCallback(() => {
    originRef.current = null
    setDrag(null)
  }, [])

  // Escape while dragging restores the clip to where the drag began.
  useEffect(() => {
    if (!drag) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      cancelGesture()
      finishDrag()
    }
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [drag, cancelGesture, finishDrag])

  // Unmounted mid-drag (e.g. the clip was removed): close the gesture so it still records.
  useEffect(
    () => () => {
      if (originRef.current) endGesture()
    },
    [endGesture]
  )

  const beginDrag = useCallback(
    (event: React.PointerEvent<HTMLElement>, mode: ClipDragMode) => {
      event.currentTarget.setPointerCapture(event.pointerId)
      originRef.current = {
        mode,
        pointerId: event.pointerId,
        pointerX: event.clientX,
        pointerY: event.clientY,
        start: clip.start,
        end: clipEnd(clip),
        trackIndex,
        hasMoved: false,
      }
      selectClip(clip.id)
      beginGesture()
      setDrag({ mode, guide: null })
    },
    [clip, trackIndex, selectClip, beginGesture]
  )

  const handleBodyPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return
      beginDrag(event, 'move')
    },
    [beginDrag]
  )

  const handleTrimStartPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return
      event.stopPropagation()
      beginDrag(event, 'trim-start')
    },
    [beginDrag]
  )

  const handleTrimEndPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return
      event.stopPropagation()
      beginDrag(event, 'trim-end')
    },
    [beginDrag]
  )

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const origin = originRef.current
      if (!origin || origin.pointerId !== event.pointerId) return
      const dx = event.clientX - origin.pointerX
      const dy = event.clientY - origin.pointerY
      if (!origin.hasMoved && Math.hypot(dx, dy) < TIMELINE_LAYOUT.DRAG_THRESHOLD_PX) return
      origin.hasMoved = true

      const delta = dx / pxPerSecond
      const options = snapOptionsFor(clip.id)

      if (origin.mode === 'move') {
        const tracks = useSoundsStore.getState().tracks
        const layer = layerRef.current
        const row = layer
          ? Math.floor((event.clientY - layer.getBoundingClientRect().top) / TIMELINE_LAYOUT.ROW_HEIGHT_PX)
          : origin.trackIndex
        const targetTrack = tracks[Math.min(tracks.length - 1, Math.max(0, row))]
        const raw = origin.start + delta
        const moved = options ? snapClipMove(raw, clip.duration, options) : { start: raw, guide: null }
        moveClip(clip.id, moved.start, targetTrack?.id)
        setDrag({ mode: 'move', guide: moved.guide })
        return
      }

      const edge = snapEdge((origin.mode === 'trim-start' ? origin.start : origin.end) + delta, options)
      if (origin.mode === 'trim-start') trimStart(clip.id, edge.time)
      else trimEnd(clip.id, edge.time)
      setDrag({ mode: origin.mode, guide: edge.guide })
    },
    [pxPerSecond, clip.id, clip.duration, layerRef, moveClip, trimStart, trimEnd]
  )

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const origin = originRef.current
      if (!origin || origin.pointerId !== event.pointerId) return
      endGesture()
      finishDrag()
    },
    [endGesture, finishDrag]
  )

  const handleFocus = useCallback(() => {
    if (!originRef.current) selectClip(clip.id)
  }, [selectClip, clip.id])

  const width = clip.duration * pxPerSecond

  return {
    name: asset?.name ?? '',
    peaks: asset?.peaks,
    sourceDuration: asset?.duration ?? 0,
    isSelected,
    isDragging: drag?.mode === 'move',
    isTrimming: drag !== null && drag.mode !== 'move',
    colorClasses: TRACK_COLOR[track.kind],
    ariaLabel: clipAriaLabel(asset?.name ?? '', track.name, clip),
    geometry: {
      left: timeToX(clip.start, pxPerSecond),
      top: trackIndex * TIMELINE_LAYOUT.ROW_HEIGHT_PX + TIMELINE_LAYOUT.CLIP_TOP_PX,
      width,
    },
    waveWidth: Math.max(0, width - TIMELINE_LAYOUT.CLIP_PADDING_X_PX),
    guideX: drag?.guide !== null && drag?.guide !== undefined ? timeToX(drag.guide, pxPerSecond) : null,
    isMuted: track.muted,
    isNarrow: width < TIMELINE_LAYOUT.CLIP_NARROW_WIDTH_PX,
    isCompact: width < TIMELINE_LAYOUT.CLIP_COMPACT_WIDTH_PX,
    handleBodyPointerDown,
    handleTrimStartPointerDown,
    handleTrimEndPointerDown,
    handlePointerMove,
    handlePointerUp,
    handleFocus,
  }
}
