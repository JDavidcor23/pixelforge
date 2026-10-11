import type { AudioAssetTag } from '@/types/audio'

// ── Sound Timeline (multi-track mixer) ───────────────────────────────────────
// All times are in seconds. A clip's `duration` is its length ON THE TIMELINE
// (after speed); the slice of source audio it plays is `duration * speed`
// seconds long, starting `offset` seconds into the source asset.

export interface TimelineTrack {
  id: string
  name: string
  kind: AudioAssetTag
  muted: boolean
  solo: boolean
  /** Linear 0..1. */
  volume: number
}

export interface TimelineClip {
  id: string
  trackId: string
  assetId: string
  /** Seconds on the timeline where the clip begins. */
  start: number
  /** Seconds into the source asset where playback begins. */
  offset: number
  /** Seconds the clip occupies on the timeline (after speed). */
  duration: number
  gainDb: number
  fadeIn: number
  fadeOut: number
  /** Playback rate, SPEED_MIN..SPEED_MAX. */
  speed: number
}

export type SoundEditorView = 'timeline' | 'sound'

/** The editable document the pure ops work on. */
export interface TimelineDocument {
  tracks: TimelineTrack[]
  clips: TimelineClip[]
}

/** One undo/redo entry. */
export interface TimelineSnapshot extends TimelineDocument {
  projectName: string
}

export interface AddClipOptions {
  trackId?: string
  start?: number
}

/** Clip properties editable from the inspector. */
export type TimelineClipPatch = Partial<Pick<TimelineClip, 'gainDb' | 'fadeIn' | 'fadeOut' | 'speed'>>

export interface SnapOptions {
  /** Grid size in seconds; 0 disables grid snapping. */
  grid: number
  /** Candidate edges (seconds) — other clips' starts/ends, playhead, 0. */
  edges: readonly number[]
  /** Max distance in seconds a value may travel to snap. */
  threshold: number
}

/** Result of an op that creates a clip. `clipId` is null when nothing changed. */
export interface TimelineOpResult {
  doc: TimelineDocument
  clipId: string | null
}

export type IdFactory = () => string
