import type { AudioAssetTag } from '@/types/audio'

// ── Sound Timeline ───────────────────────────────────────────────────────────

/** Horizontal zoom: how many pixels one second occupies. */
export const DEFAULT_PX_PER_SECOND = 200
export const MIN_PX_PER_SECOND = 50
export const MAX_PX_PER_SECOND = 800
/** Multiplicative zoom factor per zoomIn/zoomOut step. */
export const ZOOM_STEP = 1.25

export const SNAP_GRID_SECONDS = 0.1
/** Snap distance in screen pixels; convert with `snapThresholdSeconds`. */
export const SNAP_THRESHOLD_PX = 8

export const MIN_CLIP_DURATION = 0.05
/** Visible length of an empty timeline, in seconds. */
export const MIN_TIMELINE_DURATION = 4

export const SPEED_MIN = 0.5
export const SPEED_MAX = 2
export const DEFAULT_CLIP_SPEED = 1

export const GAIN_DB_MIN = -24
export const GAIN_DB_MAX = 6
export const DEFAULT_CLIP_GAIN_DB = 0

export const TRACK_VOLUME_MIN = 0
export const TRACK_VOLUME_MAX = 1
export const DEFAULT_TRACK_VOLUME = 1

export const HISTORY_LIMIT = 100

export const DEFAULT_PROJECT_NAME = 'untitled_mix'

/** Fades may never exceed this fraction of the clip's duration. */
export const MAX_FADE_RATIO = 0.5

/** Default tracks, in display order. */
export const DEFAULT_TRACK_KINDS: readonly AudioAssetTag[] = ['sfx', 'music', 'dialog'] as const

export const DEFAULT_TRACK_NAMES: Readonly<Record<AudioAssetTag, string>> = {
  sfx: 'Effects',
  music: 'Music',
  dialog: 'Voice',
} as const

/** Stable id prefix for the default tracks (`track-sfx`, …). */
export const DEFAULT_TRACK_ID_PREFIX = 'track-'

/** Tolerance for float comparisons on the timeline, in seconds. */
export const TIME_EPSILON = 1e-6
