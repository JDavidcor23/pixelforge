import type { ShortcutDefinition } from '@/types/timeline-view'

// ── Sound Timeline · layout (px values mirror the Tailwind classes noted) ────

export const TIMELINE_LAYOUT = {
  /** Track head / ruler head width — matches `w-42`. */
  HEAD_WIDTH_PX: 168,
  /** Track row pitch, border included — matches `h-21`. */
  ROW_HEIGHT_PX: 84,
  /** Clip inset from the top of its row — matches `top-2.5`. */
  CLIP_TOP_PX: 10,
  /** Space before second 0 inside every lane. */
  LANE_PADDING_PX: 16,
  /** Clip content horizontal padding (both sides) — matches `px-2`. */
  CLIP_PADDING_X_PX: 16,
  /** Empty room after the last clip, so there is always somewhere to drop. */
  TRAILING_SECONDS: 2,
  /** Auto-follow keeps the playhead at least this far from the right edge. */
  FOLLOW_MARGIN_PX: 48,
  /** Pointer travel before a press on a clip becomes a drag. */
  DRAG_THRESHOLD_PX: 3,
  /** Below this width a clip hides its name (an ellipsis-only label reads as noise). */
  CLIP_NARROW_WIDTH_PX: 48,
  /** Below this width a clip drops its content and moves its trim handles outside. */
  CLIP_COMPACT_WIDTH_PX: 24,
} as const

// ── Ruler ────────────────────────────────────────────────────────────────────

/** Candidate seconds between labelled ticks; the first one that is wide enough wins. */
export const RULER_MAJOR_STEPS: readonly number[] = [0.1, 0.25, 0.5, 1, 2, 5, 10, 15, 30, 60] as const
/** Labelled ticks never sit closer than this. */
export const RULER_MIN_MAJOR_SPACING_PX = 120
/** Unlabelled ticks between two labelled ones. */
export const RULER_MINOR_DIVISIONS = 2
/** Decimals shown in ruler labels at most ("0.25s"). */
export const RULER_LABEL_MAX_DECIMALS = 2

// ── Clip waveform ────────────────────────────────────────────────────────────

export const CLIP_WAVE = {
  BAR_WIDTH: 3,
  BAR_GAP: 2,
  BAR_RADIUS: 1,
  VIEW_HEIGHT: 40,
  MIN_BAR_HEIGHT: 2,
} as const

// ── Playback / export ────────────────────────────────────────────────────────

/** Small scheduling lead so the first clip never starts in the past. */
export const PLAYBACK_SCHEDULE_LEAD_S = 0.03
/** Smoothing for live track/master gain changes (setTargetAtTime). */
export const GAIN_SMOOTHING_S = 0.015
export const MIX_EXPORT = {
  CHANNELS: 2,
  /** Export at unity: the transport "Master" knob is a monitoring control. */
  MASTER_VOLUME: 1,
} as const

/** Clock readout: "00:01.24". */
export const CLOCK_CENTISECONDS = 100

/** Shift+arrow on the playhead moves this many snap-grid steps. */
export const PLAYHEAD_LARGE_STEP_MULTIPLIER = 10

/** Zoom slider granularity, in px per second. */
export const ZOOM_SLIDER_STEP_PX = 1

// ── Inspector ────────────────────────────────────────────────────────────────

export const CLIP_INSPECTOR = {
  GAIN_STEP_DB: 0.5,
  SPEED_STEP: 0.05,
  FADE_STEP_S: 0.01,
  SPEED_DECIMALS: 2,
  GAIN_DECIMALS: 1,
} as const

// ── Library ↔ timeline drag ──────────────────────────────────────────────────

/** dataTransfer type for a library sound being dragged onto the timeline. */
export const SOUND_DRAG_MIME = 'application/x-pixelforge-sound'
/** dataTransfer type the browser uses for OS file drops. */
export const FILES_DRAG_TYPE = 'Files'

// ── Keyboard ─────────────────────────────────────────────────────────────────

/** Placeholder rendered as ⌘ on macOS and Ctrl elsewhere. */
export const MOD_KEY = 'MOD'
export const ALT_KEY = 'ALT'
export const ALT_KEY_LABEL = { MAC: '⌥', OTHER: 'Alt' } as const
export const MOD_KEY_LABEL = { MAC: '⌘', OTHER: 'Ctrl' } as const
export const MAC_PLATFORM_PATTERN = /mac|iphone|ipad/i

/** Library row key that drops the focused sound onto the timeline. */
export const ADD_TO_TIMELINE_KEY = 'a'
export const OPEN_SOUND_KEY = 'Enter'

export const TIMELINE_SHORTCUTS: readonly ShortcutDefinition[] = [
  { label: 'Split at playhead', keys: ['S'] },
  { label: 'Duplicate', keys: ['D'] },
  { label: 'Delete', keys: ['Del', 'Backspace'], alternatives: true },
  { label: 'Snap', keys: ['N'] },
  { label: 'Play / Pause', keys: ['Space'] },
  { label: 'Undo', keys: [MOD_KEY, 'Z'] },
  { label: 'Redo', keys: [MOD_KEY, 'Shift', 'Z'] },
  { label: 'Zoom', keys: ['+', '-'], alternatives: true },
  { label: 'Move clip', keys: ['←', '→'], alternatives: true },
  { label: 'Trim end', keys: ['Shift', '← →'] },
  { label: 'Trim start', keys: [ALT_KEY, '← →'] },
  { label: 'Keyboard shortcuts', keys: ['?'] },
] as const

// ── Copy ─────────────────────────────────────────────────────────────────────

export const TIMELINE_ERRORS = {
  EXPORT_FAILED: 'Couldn’t export the mix. Try again.',
  MISSING_AUDIO: 'Some sounds couldn’t be loaded, so the mix wasn’t exported.',
} as const

/** TipBar copy: one plain-words hint for what the user can do right now. */
export const TIMELINE_TIPS = {
  EMPTY: 'Start by dragging a sound from the library onto a track, or press + on a sound.',
  IDLE: 'Click a clip to select it. Drag it to move it, or drag its edges to make it shorter or longer.',
  SELECTED_OUTSIDE:
    'To cut this clip, click the ruler above it to move the playhead there, then press S.',
  SELECTED_INSIDE: 'Press S to cut the clip at the playhead, D to duplicate it, or Delete to remove it.',
  CLIP_DELETED: 'Clip deleted.',
  UNDO: 'Undo',
} as const

/** How long the "Clip deleted · Undo" notice stays in the TipBar. */
export const TIP_NOTICE_DURATION_MS = 6000

/** Keys a focused clip responds to (announced via aria-keyshortcuts). */
export const CLIP_KEY_SHORTCUTS =
  'ArrowLeft ArrowRight Shift+ArrowLeft Shift+ArrowRight Alt+ArrowLeft Alt+ArrowRight S D Delete'

export const SAVE_STATUS = {
  LABEL: 'In this tab',
  TITLE: 'Unsaved — kept while this tab is open',
} as const
