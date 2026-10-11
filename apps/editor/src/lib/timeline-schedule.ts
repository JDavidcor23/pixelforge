import type { TimelineClip } from '@/types/timeline'
import type { ClipScheduleEntry, GainPoint } from '@/types/timeline-view'
import { TIME_EPSILON } from '@/constants/timeline'
import { clipEnd, dbToGain } from './timeline-ops'

// Pure scheduling math for the mixer: given a playhead, WHEN does every clip
// start sounding, FROM WHERE in its source, for HOW LONG, and with what gain
// curve. The Web Audio wiring (timeline-player.ts) only executes this plan.

/** Fade envelope 0..1 at `time` seconds into the clip (timeline seconds). */
export function fadeEnvelopeAt(clip: TimelineClip, time: number): number {
  const fadeInLevel = clip.fadeIn > 0 ? time / clip.fadeIn : 1
  const fadeOutLevel = clip.fadeOut > 0 ? (clip.duration - time) / clip.fadeOut : 1
  return Math.max(0, Math.min(1, fadeInLevel, fadeOutLevel))
}

/**
 * Gain automation for a clip that starts playing `localStart` seconds into
 * itself. Times in the result are relative to that moment. Fades are linear
 * and never overlap (timeline-ops caps each at half the clip).
 */
export function clipEnvelope(clip: TimelineClip, localStart: number): GainPoint[] {
  const gain = dbToGain(clip.gainDb)
  const fadeOutStart = clip.duration - clip.fadeOut
  const times = [localStart]
  if (clip.fadeIn > 0 && clip.fadeIn > localStart + TIME_EPSILON) times.push(clip.fadeIn)
  if (clip.fadeOut > 0) {
    if (fadeOutStart > times[times.length - 1] + TIME_EPSILON) times.push(fadeOutStart)
    times.push(clip.duration)
  }
  return times.map((time) => ({ time: time - localStart, value: gain * fadeEnvelopeAt(clip, time) }))
}

/**
 * Every clip that still has something to play at or after `fromTime`.
 * A clip under the playhead starts immediately (`when = 0`) mid-way through
 * its source; later clips wait `clip.start - fromTime` seconds.
 */
export function scheduleClips(clips: readonly TimelineClip[], fromTime: number): ClipScheduleEntry[] {
  return clips.flatMap((clip) => {
    if (clipEnd(clip) - fromTime <= TIME_EPSILON) return []
    const localStart = Math.max(0, fromTime - clip.start)
    return [
      {
        clipId: clip.id,
        assetId: clip.assetId,
        trackId: clip.trackId,
        when: Math.max(0, clip.start - fromTime),
        offset: clip.offset + localStart * clip.speed,
        playFor: clip.duration - localStart,
        speed: clip.speed,
        envelope: clipEnvelope(clip, localStart),
      },
    ]
  })
}

/** End of the last clip (0 for an empty timeline) — the length of an exported mix. */
export function mixLength(clips: readonly TimelineClip[]): number {
  return clips.reduce((max, clip) => Math.max(max, clipEnd(clip)), 0)
}
