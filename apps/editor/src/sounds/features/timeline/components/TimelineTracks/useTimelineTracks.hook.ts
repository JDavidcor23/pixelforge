import { useCallback, useEffect, useRef, useState } from 'react'

import { useSoundsStore } from '@/stores/sounds.store'
import { useAddToTimeline } from '@/sounds/hooks/useAddToTimeline.hook'
import { soundDragSession } from '@/lib/sound-drag-session'
import { collectSnapEdges, snapThresholdSeconds, snapTime } from '@/lib/timeline-ops'
import { laneWidthPx, timeToX, xToTime } from '@/lib/timeline-view'
import { SNAP_GRID_SECONDS } from '@/constants/timeline'
import { SOUND_DRAG_MIME, TIMELINE_LAYOUT } from '@/constants/timeline-view'

interface DropTarget {
  trackIndex: number
  start: number
}

const isSoundDrag = (event: React.DragEvent): boolean =>
  event.dataTransfer.types.includes(SOUND_DRAG_MIME)

/**
 * The scrollable track area: geometry and library drops (the playhead and
 * its auto-follow live in `Playhead`, so playback never re-renders this). Drops are handled on the rows container (lanes AND clips bubble to
 * it), resolving the track from the pointer's row and the time from its x.
 */
export function useTimelineTracks() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const layerRef = useRef<HTMLDivElement>(null)
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null)
  // Lane area visible inside the scroller, so the drop zone stays on screen on horizontal scroll.
  const [visibleLaneWidth, setVisibleLaneWidth] = useState(0)

  const tracks = useSoundsStore((state) => state.tracks)
  const clips = useSoundsStore((state) => state.clips)
  const assets = useSoundsStore((state) => state.assets)
  // Clips already on screen when the view opens don't flash; only ones created afterwards do.
  const [mountedClipIds] = useState(() => new Set(useSoundsStore.getState().clips.map((clip) => clip.id)))
  const pxPerSecond = useSoundsStore((state) => state.pxPerSecond)
  const selectClip = useSoundsStore((state) => state.selectClip)
  const { addToTimeline } = useAddToTimeline()

  const laneWidth = laneWidthPx(clips, pxPerSecond)

  useEffect(() => {
    const scroller = scrollRef.current
    if (!scroller) return
    const measure = () =>
      setVisibleLaneWidth(Math.max(0, scroller.clientWidth - TIMELINE_LAYOUT.HEAD_WIDTH_PX))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(scroller)
    return () => observer.disconnect()
  }, [])

  const locateDrop = useCallback(
    (event: React.DragEvent): DropTarget | null => {
      const layer = layerRef.current
      if (!layer || tracks.length === 0) return null
      const rect = layer.getBoundingClientRect()
      const row = Math.floor((event.clientY - rect.top) / TIMELINE_LAYOUT.ROW_HEIGHT_PX)
      const trackIndex = Math.min(tracks.length - 1, Math.max(0, row))
      const { snapEnabled, clips: liveClips, playheadTime: playhead } = useSoundsStore.getState()
      const raw = xToTime(event.clientX - rect.left, pxPerSecond)
      const start = snapEnabled
        ? snapTime(raw, {
            grid: SNAP_GRID_SECONDS,
            edges: collectSnapEdges(liveClips, null, [playhead]),
            threshold: snapThresholdSeconds(pxPerSecond),
          })
        : raw
      return { trackIndex, start: Math.max(0, start) }
    },
    [tracks.length, pxPerSecond]
  )

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (!isSoundDrag(event)) return
      event.preventDefault()
      event.dataTransfer.dropEffect = 'copy'
      const next = locateDrop(event)
      setDropTarget((current) =>
        current && next && current.trackIndex === next.trackIndex && current.start === next.start
          ? current
          : next
      )
    },
    [locateDrop]
  )

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return
    setDropTarget(null)
  }, [])

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      const assetId = event.dataTransfer.getData(SOUND_DRAG_MIME)
      setDropTarget(null)
      if (!assetId) return
      event.preventDefault()
      const target = locateDrop(event)
      if (!target) return
      addToTimeline(assetId, { trackId: tracks[target.trackIndex].id, start: target.start })
    },
    [locateDrop, addToTimeline, tracks]
  )

  const handleLanePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button === 0) selectClip(null)
    },
    [selectClip]
  )

  const trackIndexById = new Map(tracks.map((track, index) => [track.id, index]))
  const draggedAsset = dropTarget ? assets.find((item) => item.id === soundDragSession.current()) : undefined
  const ghostTrack = dropTarget ? tracks[dropTarget.trackIndex] : undefined
  const ghost =
    dropTarget && draggedAsset && ghostTrack
      ? {
          kind: ghostTrack.kind,
          left: timeToX(dropTarget.start, pxPerSecond),
          top: dropTarget.trackIndex * TIMELINE_LAYOUT.ROW_HEIGHT_PX + TIMELINE_LAYOUT.CLIP_TOP_PX,
          width: draggedAsset.duration * pxPerSecond,
        }
      : null

  return {
    scrollRef,
    layerRef,
    rows: tracks.map((track, index) => ({ track, isDropTarget: dropTarget?.trackIndex === index })),
    placedClips: clips.flatMap((clip) => {
      const trackIndex = trackIndexById.get(clip.trackId)
      return trackIndex === undefined
        ? []
        : [{ clip, track: tracks[trackIndex], trackIndex, isNew: !mountedClipIds.has(clip.id) }]
    }),
    ghost,
    laneWidth,
    visibleLaneWidth,
    isEmpty: clips.length === 0,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleLanePointerDown,
  }
}
