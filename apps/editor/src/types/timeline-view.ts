import type { LucideIcon } from 'lucide-react'

import type { AudioAssetTag } from '@/types/audio'
import type { TimelineClip, TimelineTrack } from '@/types/timeline'

// ── Sound Timeline · view + playback types ───────────────────────────────────

/** One gain automation point, in seconds from the moment the clip starts playing. */
export interface GainPoint {
  time: number
  value: number
}

/**
 * How one clip plays when the mix starts at a given playhead. Times are
 * relative to the moment playback starts (`when`) or to the clip's own start.
 */
export interface ClipScheduleEntry {
  clipId: string
  assetId: string
  trackId: string
  /** Seconds after playback starts when this clip begins sounding. */
  when: number
  /** Seconds into the source buffer where playback begins. */
  offset: number
  /** Seconds of timeline the clip sounds for (after speed). */
  playFor: number
  speed: number
  /** Clip gain × fade envelope; the first point is the starting value. */
  envelope: GainPoint[]
}

/** Everything needed to build the mix graph on any audio context. */
export interface MixInput {
  clips: readonly TimelineClip[]
  tracks: readonly TimelineTrack[]
  buffers: ReadonlyMap<string, AudioBuffer>
  masterVolume: number
}

export interface RulerTick {
  time: number
  x: number
  major: boolean
  label: string | null
}

export interface WaveBar {
  x: number
  y: number
  height: number
}

/** Literal Tailwind class sets per track kind (must be static for the scanner). */
export interface TrackColorClasses {
  ICON: string
  CLIP: string
  WAVE: string
  GHOST: string
}

export interface TrackKindOption {
  kind: AudioAssetTag
  label: string
  icon: LucideIcon
}

export type ClipDragMode = 'move' | 'trim-start' | 'trim-end'

/** Result of snapping a dragged clip: where it lands and the edge it locked to. */
export interface SnappedMove {
  start: number
  /** Timeline second of the edge that snapped, or null when nothing snapped. */
  guide: number | null
}

/** A keyboard shortcut row; `MOD` is rendered as ⌘ on macOS and Ctrl elsewhere. */
export interface ShortcutDefinition {
  label: string
  keys: readonly string[]
  /** Keys are alternatives ("Del / Backspace") rather than a chord ("⌘ Z"). */
  alternatives?: boolean
}

export type TimelineShortcutAction =
  | 'split'
  | 'duplicate'
  | 'delete'
  | 'toggle-snap'
  | 'toggle-play'
  | 'undo'
  | 'redo'
  | 'zoom-in'
  | 'zoom-out'
  | 'escape'
  | 'nudge-left'
  | 'nudge-right'
  | 'trim-end-left'
  | 'trim-end-right'
  | 'trim-start-left'
  | 'trim-start-right'
  | 'show-shortcuts'

/** Shortcut actions that live outside the store (audio transport, UI). */
export interface TimelineShortcutHandlers {
  onTogglePlay: () => void
  onShowShortcuts: () => void
}

/** The subset of a KeyboardEvent the shortcut resolver needs (testable without DOM). */
export interface ShortcutKeyEvent {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  altKey: boolean
}
