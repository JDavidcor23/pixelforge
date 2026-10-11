import { AddTrackRow } from '../AddTrackRow/AddTrackRow'
import { Playhead } from '../Playhead/Playhead'
import { TimelineClip } from '../TimelineClip/TimelineClip'
import { TimelineRuler } from '../TimelineRuler/TimelineRuler'
import { TrackHeader } from '../TrackHeader/TrackHeader'
import { TrackLane } from '../TrackLane/TrackLane'
import { useTimelineTracks } from './useTimelineTracks.hook'
import { TRACK_COLOR } from '@/constants/track-colors'

interface TimelineTracksProps {
  isPlaying: boolean
}

export function TimelineTracks({ isPlaying }: TimelineTracksProps) {
  const {
    scrollRef,
    layerRef,
    rows,
    placedClips,
    ghost,
    laneWidth,
    visibleLaneWidth,
    isEmpty,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleLanePointerDown,
  } = useTimelineTracks()

  return (
    <div ref={scrollRef} className="relative flex min-h-0 flex-1 flex-col overflow-auto bg-surface">
      <div className="flex min-h-full w-max min-w-full flex-col">
        <TimelineRuler laneWidth={laneWidth} />

        <div
          className="relative shrink-0"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {rows.map(({ track, isDropTarget }) => (
            <div
              key={track.id}
              data-muted={track.muted || undefined}
              className="group flex h-21 border-b border-line"
            >
              <TrackHeader track={track} />
              <TrackLane isDropTarget={isDropTarget} onPointerDown={handleLanePointerDown} />
            </div>
          ))}

          {/* One shared layer for every clip, so a clip dragged to another
              track keeps its element (and pointer capture). */}
          <div ref={layerRef} className="pointer-events-none absolute inset-y-0 right-0 left-42 isolate">
            {placedClips.map(({ clip, track, trackIndex, isNew }) => (
              <TimelineClip
                key={clip.id}
                clip={clip}
                track={track}
                trackIndex={trackIndex}
                isNew={isNew}
                layerRef={layerRef}
              />
            ))}
            {ghost && (
              <div
                aria-hidden
                className={`pointer-events-none absolute h-16 rounded border border-dashed opacity-70 ${TRACK_COLOR[ghost.kind].GHOST}`}
                style={{ left: ghost.left, top: ghost.top, width: ghost.width }}
              />
            )}
            <Playhead scrollRef={scrollRef} isPlaying={isPlaying} />
          </div>
        </div>

        <AddTrackRow isEmpty={isEmpty} visibleLaneWidth={visibleLaneWidth} />
      </div>
    </div>
  )
}
