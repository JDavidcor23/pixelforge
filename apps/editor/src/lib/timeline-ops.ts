import type { AudioAsset, AudioAssetTag } from '@/types/audio'
import type {
  AddClipOptions,
  IdFactory,
  SnapOptions,
  TimelineClip,
  TimelineClipPatch,
  TimelineDocument,
  TimelineOpResult,
  TimelineTrack,
} from '@/types/timeline'
import {
  DEFAULT_CLIP_GAIN_DB,
  DEFAULT_CLIP_SPEED,
  DEFAULT_TRACK_ID_PREFIX,
  DEFAULT_TRACK_KINDS,
  DEFAULT_TRACK_NAMES,
  DEFAULT_TRACK_VOLUME,
  GAIN_DB_MAX,
  GAIN_DB_MIN,
  MAX_FADE_RATIO,
  MIN_CLIP_DURATION,
  MIN_TIMELINE_DURATION,
  SNAP_THRESHOLD_PX,
  SPEED_MAX,
  SPEED_MIN,
  TIME_EPSILON,
  TRACK_VOLUME_MAX,
  TRACK_VOLUME_MIN,
} from '@/constants/timeline'
import { getAssetKind } from './sound-assets'

// Every op is pure: it never mutates its input and returns the SAME document
// reference when nothing changed, so callers can skip history entries cheaply.

const defaultIdFactory: IdFactory = () => crypto.randomUUID()

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

// ── Clip math ────────────────────────────────────────────────────────────────

export const clipEnd = (clip: TimelineClip): number => clip.start + clip.duration

/** Seconds of source audio the clip plays. */
export const clipSourceSpan = (clip: TimelineClip): number => clip.duration * clip.speed

export const isTimeInsideClip = (clip: TimelineClip, time: number): boolean =>
  time > clip.start + TIME_EPSILON && time < clipEnd(clip) - TIME_EPSILON

const clampFades = (clip: TimelineClip): TimelineClip => {
  const maxFade = clip.duration * MAX_FADE_RATIO
  const fadeIn = clamp(clip.fadeIn, 0, maxFade)
  const fadeOut = clamp(clip.fadeOut, 0, maxFade)
  return fadeIn === clip.fadeIn && fadeOut === clip.fadeOut ? clip : { ...clip, fadeIn, fadeOut }
}

const findClip = (doc: TimelineDocument, clipId: string): TimelineClip | undefined =>
  doc.clips.find((clip) => clip.id === clipId)

const replaceClip = (doc: TimelineDocument, next: TimelineClip): TimelineDocument => ({
  ...doc,
  clips: doc.clips.map((clip) => (clip.id === next.id ? next : clip)),
})

const isSameClip = (a: TimelineClip, b: TimelineClip): boolean =>
  a.trackId === b.trackId &&
  a.start === b.start &&
  a.offset === b.offset &&
  a.duration === b.duration &&
  a.gainDb === b.gainDb &&
  a.fadeIn === b.fadeIn &&
  a.fadeOut === b.fadeOut &&
  a.speed === b.speed

/** Applies `next` only if it differs, preserving the doc reference otherwise. */
const commitClip = (doc: TimelineDocument, prev: TimelineClip, next: TimelineClip): TimelineDocument =>
  isSameClip(prev, next) ? doc : replaceClip(doc, next)

// ── Tracks ───────────────────────────────────────────────────────────────────

export const defaultTrackId = (kind: AudioAssetTag): string => `${DEFAULT_TRACK_ID_PREFIX}${kind}`

const buildTrack = (id: string, kind: AudioAssetTag, name: string): TimelineTrack => ({
  id,
  name,
  kind,
  muted: false,
  solo: false,
  volume: DEFAULT_TRACK_VOLUME,
})

/** Effects / Music / Voice, with stable ids. */
export function createDefaultTracks(): TimelineTrack[] {
  return DEFAULT_TRACK_KINDS.map((kind) => buildTrack(defaultTrackId(kind), kind, DEFAULT_TRACK_NAMES[kind]))
}

export function createEmptyDocument(): TimelineDocument {
  return { tracks: createDefaultTracks(), clips: [] }
}

export function addTrack(
  doc: TimelineDocument,
  kind: AudioAssetTag,
  name: string = DEFAULT_TRACK_NAMES[kind],
  createId: IdFactory = defaultIdFactory
): { doc: TimelineDocument; trackId: string } {
  const trackId = createId()
  return { doc: { ...doc, tracks: [...doc.tracks, buildTrack(trackId, kind, name)] }, trackId }
}

const updateTrack = (
  doc: TimelineDocument,
  trackId: string,
  update: (track: TimelineTrack) => TimelineTrack
): TimelineDocument => {
  const track = doc.tracks.find((item) => item.id === trackId)
  if (!track) return doc
  const next = update(track)
  if (next === track) return doc
  return { ...doc, tracks: doc.tracks.map((item) => (item.id === trackId ? next : item)) }
}

export function renameTrack(doc: TimelineDocument, trackId: string, name: string): TimelineDocument {
  const trimmed = name.trim()
  return updateTrack(doc, trackId, (track) =>
    !trimmed || trimmed === track.name ? track : { ...track, name: trimmed }
  )
}

export function toggleTrackMute(doc: TimelineDocument, trackId: string): TimelineDocument {
  return updateTrack(doc, trackId, (track) => ({ ...track, muted: !track.muted }))
}

export function toggleTrackSolo(doc: TimelineDocument, trackId: string): TimelineDocument {
  return updateTrack(doc, trackId, (track) => ({ ...track, solo: !track.solo }))
}

export function setTrackVolume(doc: TimelineDocument, trackId: string, volume: number): TimelineDocument {
  const next = clamp(volume, TRACK_VOLUME_MIN, TRACK_VOLUME_MAX)
  return updateTrack(doc, trackId, (track) => (track.volume === next ? track : { ...track, volume: next }))
}

// ── Clips ────────────────────────────────────────────────────────────────────

/** End of the last clip on a track (0 when the track is empty). */
export function trackEnd(clips: readonly TimelineClip[], trackId: string): number {
  return clips.reduce((max, clip) => (clip.trackId === trackId ? Math.max(max, clipEnd(clip)) : max), 0)
}

/**
 * Drops an asset onto the timeline. Without a `trackId` it lands on the first
 * track matching the asset's kind (falling back to the first track); without
 * a `start` it is appended after the last clip on that track.
 */
export function addClipFromAsset(
  doc: TimelineDocument,
  asset: AudioAsset,
  options: AddClipOptions = {},
  createId: IdFactory = defaultIdFactory
): TimelineOpResult {
  const kind = getAssetKind(asset)
  const track =
    doc.tracks.find((item) => item.id === options.trackId) ??
    doc.tracks.find((item) => item.kind === kind) ??
    doc.tracks[0]
  if (!track) return { doc, clipId: null }

  const clip: TimelineClip = {
    id: createId(),
    trackId: track.id,
    assetId: asset.id,
    start: Math.max(0, options.start ?? trackEnd(doc.clips, track.id)),
    offset: 0,
    duration: Math.max(MIN_CLIP_DURATION, asset.duration),
    gainDb: DEFAULT_CLIP_GAIN_DB,
    fadeIn: 0,
    fadeOut: 0,
    speed: DEFAULT_CLIP_SPEED,
  }
  return { doc: { ...doc, clips: [...doc.clips, clip] }, clipId: clip.id }
}

/** Moves a clip (start clamped ≥ 0), optionally onto another existing track. */
export function moveClip(
  doc: TimelineDocument,
  clipId: string,
  start: number,
  trackId?: string
): TimelineDocument {
  const clip = findClip(doc, clipId)
  if (!clip) return doc
  const targetTrack = trackId && doc.tracks.some((track) => track.id === trackId) ? trackId : clip.trackId
  return commitClip(doc, clip, { ...clip, start: Math.max(0, start), trackId: targetTrack })
}

/**
 * Drags the left edge. The right edge stays put; `offset` moves with it and
 * can never go below 0 (start of the source).
 */
export function trimClipStart(doc: TimelineDocument, clipId: string, newStart: number): TimelineDocument {
  const clip = findClip(doc, clipId)
  if (!clip) return doc
  const end = clipEnd(clip)
  const earliest = Math.max(0, clip.start - clip.offset / clip.speed)
  const start = clamp(newStart, earliest, end - MIN_CLIP_DURATION)
  const offset = Math.max(0, clip.offset + (start - clip.start) * clip.speed)
  return commitClip(doc, clip, clampFades({ ...clip, start, offset, duration: end - start }))
}

/**
 * Drags the right edge. Clamped so the clip never plays past the end of its
 * source (`offset + duration * speed ≤ sourceDuration`).
 */
export function trimClipEnd(
  doc: TimelineDocument,
  clipId: string,
  newEnd: number,
  sourceDuration: number
): TimelineDocument {
  const clip = findClip(doc, clipId)
  if (!clip) return doc
  const latest = clip.start + Math.max(0, sourceDuration - clip.offset) / clip.speed
  const minEnd = clip.start + MIN_CLIP_DURATION
  const end = clamp(newEnd, minEnd, Math.max(minEnd, latest))
  return commitClip(doc, clip, clampFades({ ...clip, duration: end - clip.start }))
}

/**
 * Cuts a clip in two at `time`. The left part keeps the id and fade-in; the
 * right part gets a new id, the fade-out and an offset advanced by the source
 * time consumed. No-op unless both halves are at least MIN_CLIP_DURATION.
 */
export function splitClip(
  doc: TimelineDocument,
  clipId: string,
  time: number,
  createId: IdFactory = defaultIdFactory
): TimelineOpResult {
  const clip = findClip(doc, clipId)
  if (!clip || !isTimeInsideClip(clip, time)) return { doc, clipId: null }
  const leftDuration = time - clip.start
  const rightDuration = clipEnd(clip) - time
  if (leftDuration < MIN_CLIP_DURATION || rightDuration < MIN_CLIP_DURATION) return { doc, clipId: null }

  const left = clampFades({ ...clip, duration: leftDuration, fadeOut: 0 })
  const right = clampFades({
    ...clip,
    id: createId(),
    start: time,
    offset: clip.offset + leftDuration * clip.speed,
    duration: rightDuration,
    fadeIn: 0,
  })
  const clips = doc.clips.flatMap((item) => (item.id === clip.id ? [left, right] : [item]))
  return { doc: { ...doc, clips }, clipId: right.id }
}

/**
 * Split at the playhead:
 * - selected clip under the playhead → split just that clip;
 * - selected clip elsewhere → split every clip under the playhead on its track;
 * - no selection → split every clip under the playhead on every track.
 */
export function splitAtPlayhead(
  doc: TimelineDocument,
  time: number,
  selectedClipId: string | null,
  createId: IdFactory = defaultIdFactory
): TimelineDocument {
  const selected = selectedClipId ? findClip(doc, selectedClipId) : undefined
  const targets =
    selected && isTimeInsideClip(selected, time)
      ? [selected]
      : doc.clips.filter(
          (clip) => isTimeInsideClip(clip, time) && (!selected || clip.trackId === selected.trackId)
        )
  return targets.reduce((acc, clip) => splitClip(acc, clip.id, time, createId).doc, doc)
}

/** Copies a clip and places the copy right after the original, same track. */
export function duplicateClip(
  doc: TimelineDocument,
  clipId: string,
  createId: IdFactory = defaultIdFactory
): TimelineOpResult {
  const clip = findClip(doc, clipId)
  if (!clip) return { doc, clipId: null }
  const copy: TimelineClip = { ...clip, id: createId(), start: clipEnd(clip) }
  const index = doc.clips.indexOf(clip)
  const clips = [...doc.clips.slice(0, index + 1), copy, ...doc.clips.slice(index + 1)]
  return { doc: { ...doc, clips }, clipId: copy.id }
}

export function deleteClip(doc: TimelineDocument, clipId: string): TimelineDocument {
  if (!findClip(doc, clipId)) return doc
  return { ...doc, clips: doc.clips.filter((clip) => clip.id !== clipId) }
}

export function removeClipsForAsset(doc: TimelineDocument, assetId: string): TimelineDocument {
  if (!doc.clips.some((clip) => clip.assetId === assetId)) return doc
  return { ...doc, clips: doc.clips.filter((clip) => clip.assetId !== assetId) }
}

export function countClipsForAsset(clips: readonly TimelineClip[], assetId: string): number {
  return clips.reduce((count, clip) => (clip.assetId === assetId ? count + 1 : count), 0)
}

/**
 * Inspector edits. Gain and speed are clamped to their ranges; changing speed
 * keeps the same slice of source audio, so the timeline duration becomes
 * `sourceSpan / speed`. Fades are capped at half the (new) duration.
 */
export function updateClip(
  doc: TimelineDocument,
  clipId: string,
  patch: TimelineClipPatch,
  sourceDuration: number
): TimelineDocument {
  const clip = findClip(doc, clipId)
  if (!clip) return doc

  let next: TimelineClip = { ...clip }
  if (patch.gainDb !== undefined) next.gainDb = clamp(patch.gainDb, GAIN_DB_MIN, GAIN_DB_MAX)
  if (patch.speed !== undefined) {
    const speed = clamp(patch.speed, SPEED_MIN, SPEED_MAX)
    const available = Math.max(0, sourceDuration - clip.offset)
    const span = Math.min(clipSourceSpan(clip), available)
    next = { ...next, speed, duration: Math.max(MIN_CLIP_DURATION, span / speed) }
  }
  if (patch.fadeIn !== undefined) next.fadeIn = patch.fadeIn
  if (patch.fadeOut !== undefined) next.fadeOut = patch.fadeOut

  return commitClip(doc, clip, clampFades(next))
}

// ── Snapping ─────────────────────────────────────────────────────────────────

export const snapThresholdSeconds = (pxPerSecond: number): number => SNAP_THRESHOLD_PX / pxPerSecond

/** Starts and ends of every clip except `excludeClipId`, plus 0 and `extra`. */
export function collectSnapEdges(
  clips: readonly TimelineClip[],
  excludeClipId: string | null,
  extra: readonly number[] = []
): number[] {
  const edges = clips
    .filter((clip) => clip.id !== excludeClipId)
    .flatMap((clip) => [clip.start, clipEnd(clip)])
  return [0, ...edges, ...extra]
}

/**
 * Snaps `time` to the nearest edge within `threshold`; edges win over the
 * grid. Falls back to the nearest grid line within `threshold`, else `time`.
 */
export function snapTime(time: number, { grid, edges, threshold }: SnapOptions): number {
  let best = time
  let bestDistance = threshold
  for (const edge of edges) {
    const distance = Math.abs(edge - time)
    if (distance <= bestDistance) {
      best = edge
      bestDistance = distance
    }
  }
  if (best !== time || grid <= 0) return best

  const gridLine = Math.round(time / grid) * grid
  return Math.abs(gridLine - time) <= threshold ? gridLine : time
}

// ── Mix ──────────────────────────────────────────────────────────────────────

/** Length of the mix: end of the last clip, never shorter than MIN_TIMELINE_DURATION. */
export function timelineDuration(clips: readonly TimelineClip[]): number {
  return clips.reduce((max, clip) => Math.max(max, clipEnd(clip)), MIN_TIMELINE_DURATION)
}

export const hasSoloTrack = (tracks: readonly TimelineTrack[]): boolean => tracks.some((track) => track.solo)

/** Linear gain a track contributes: 0 when muted or silenced by another solo. */
export function effectiveGain(track: TimelineTrack, anySolo: boolean): number {
  if (track.muted) return 0
  if (anySolo && !track.solo) return 0
  return track.volume
}

const DB_PER_DECADE = 20
const DECIBEL_BASE = 10

export const dbToGain = (db: number): number => DECIBEL_BASE ** (db / DB_PER_DECADE)
