import { ArrowUp, Bomb, Coins, Star, Swords, Volume2 } from 'lucide-react'

import type {
  AudioAssetTag,
  ElevenLabsMode,
  NewSoundSection,
  PresetTileDefinition,
  TweakParamDefinition,
} from '@/types/audio'

// ── Kinds ────────────────────────────────────────────────────────────────────
// The data model keeps 'sfx' | 'music' | 'dialog'; only the labels are friendly.

export const SOUND_KIND_LABELS: Readonly<Record<AudioAssetTag, string>> = {
  sfx: 'Effect',
  music: 'Music',
  dialog: 'Voice',
} as const

/** Fallback kind for assets without a recognized tag. */
export const DEFAULT_SOUND_KIND: AudioAssetTag = 'sfx'

export const LIBRARY_FILTERS: ReadonlyArray<{ label: string; value: AudioAssetTag | null }> = [
  { label: 'All', value: null },
  { label: 'Effects', value: 'sfx' },
  { label: 'Music', value: 'music' },
  { label: 'Voice', value: 'dialog' },
] as const

/** Kind segmented control in the AI section → ElevenLabs mode. */
export const AI_KIND_OPTIONS: ReadonlyArray<{ label: string; mode: ElevenLabsMode }> = [
  { label: 'Effect', mode: 'sfx' },
  { label: 'Music', mode: 'music' },
  { label: 'Voice', mode: 'tts' },
] as const

export const MODE_TO_TAG: Readonly<Record<ElevenLabsMode, AudioAssetTag>> = {
  sfx: 'sfx',
  music: 'music',
  tts: 'dialog',
} as const

export const TAG_TO_MODE: Readonly<Record<AudioAssetTag, ElevenLabsMode>> = {
  sfx: 'sfx',
  music: 'music',
  dialog: 'tts',
} as const

// ── Presets (New Sound popover) ──────────────────────────────────────────────

export const PRESET_TILES: readonly PresetTileDefinition[] = [
  { presetId: 'preset-jump', label: 'Jump', icon: ArrowUp },
  { presetId: 'preset-coin', label: 'Coin', icon: Coins },
  { presetId: 'preset-laser', label: 'Laser', icon: Volume2 },
  { presetId: 'preset-explosion', label: 'Explosion', icon: Bomb },
  { presetId: 'preset-powerup', label: 'Power-up', icon: Star },
  { presetId: 'preset-hit', label: 'Hit', icon: Swords },
] as const

/** `data-autofocus` value per popover section; the popover focuses it on open. */
export const NEW_SOUND_AUTOFOCUS: Readonly<Record<NewSoundSection, string>> = {
  presets: 'presets',
  ai: 'ai',
} as const

/** Hover/focus must rest this long before a preset preview plays. */
export const PRESET_PREVIEW_DEBOUNCE_MS = 180
export const PRESET_PREVIEW_DURATION_S = 0.6

// ── Waveforms ────────────────────────────────────────────────────────────────

/** Resolution peaks are stored at on the asset; views resample from it. */
export const WAVE_PEAK_COUNT = 120
export const MINI_WAVE_BAR_COUNT = 18
export const MINI_WAVE = {
  VIEW_WIDTH: 56,
  VIEW_HEIGHT: 22,
  BAR_WIDTH: 2,
  BAR_GAP: 1,
  MIN_BAR_HEIGHT: 2,
} as const

export const WAVE_BAR_WIDTH = 6
export const WAVE_BAR_GAP = 2
export const WAVE_BAR_RADIUS = 1
export const WAVE_VIEW_HEIGHT = 170
export const WAVE_MIN_BAR_HEIGHT = 2
/** Bars drawn in the big waveform (resampled from WAVE_PEAK_COUNT). */
export const WAVE_BAR_COUNT = 96

/** Shown for assets whose audio has not been decoded yet. */
export const PLACEHOLDER_PEAKS: readonly number[] = [
  0.3, 0.5, 0.8, 0.6, 0.9, 0.7, 0.5, 0.65, 0.4, 0.55, 0.35, 0.45, 0.3, 0.25, 0.35, 0.2, 0.15, 0.1,
] as const

// ── Playback ─────────────────────────────────────────────────────────────────

/** Seconds moved per ←/→ press on the waveform position slider. */
export const SEEK_STEP_S = 0.05
export const TIME_DECIMALS = 2
/** Durations at or above this read with one decimal ("48.0s"). */
export const LONG_DURATION_THRESHOLD_S = 10
export const LONG_DURATION_DECIMALS = 1
export const SECONDS_PER_MINUTE = 60
export const SECONDS_PER_HOUR = 3600
export const VOLUME_RANGE = { MIN: 0, MAX: 1, STEP: 0.01 } as const

// ── Tweak sliders ────────────────────────────────────────────────────────────

export const TWEAK_SLIDER = {
  MIN: 0,
  MAX: 100,
  STEP: 1,
  /** Shown (disabled) when the asset has no synth recipe to tweak. */
  NEUTRAL: 50,
} as const

export const TWEAK_PARAMS: readonly TweakParamDefinition[] = [
  { key: 'pitch', label: 'Pitch', lo: 'Deeper', hi: 'Higher' },
  { key: 'length', label: 'Length', lo: 'Shorter', hi: 'Longer' },
  { key: 'punch', label: 'Punch', lo: 'Soft start', hi: 'Hits hard' },
  { key: 'tone', label: 'Tone', lo: 'Darker', hi: 'Brighter' },
] as const

/**
 * Ranges the friendly sliders sweep. All are mapped logarithmically because
 * pitch, time and cutoff are all perceived on a log scale.
 */
export const TWEAK_RANGES = {
  /** oscillator.frequency, Hz */
  PITCH_HZ: { min: 60, max: 4000 },
  /** envelope.decay + envelope.release, ms */
  LENGTH_MS: { min: 40, max: 3000 },
  /** envelope.attack, ms — inverted: more punch = shorter attack */
  ATTACK_MS: { min: 1, max: 600 },
  /** filter.frequency, Hz */
  TONE_HZ: { min: 120, max: 16000 },
} as const

/** Share of LENGTH that goes to decay when the asset has no decay/release yet. */
export const DEFAULT_DECAY_SHARE = 0.4

/** Wait for the slider to settle before re-rendering the sound. */
export const TWEAK_REGENERATE_DEBOUNCE_MS = 160

// ── Variations ───────────────────────────────────────────────────────────────

export const VARIATION_COUNT = 3
/** Max relative drift applied to each synth parameter per variation (±). */
export const VARIATION_SPREAD = {
  FREQUENCY: 0.12,
  ENVELOPE: 0.2,
  FILTER: 0.2,
  DETUNE_CENTS: 15,
} as const
export const VARIATION_NAME_SUFFIX = '_v'
export const DUPLICATE_NAME_SUFFIX = '_copy'

// ── Generation / import ──────────────────────────────────────────────────────

/**
 * Premade ElevenLabs voice ("Rachel") used for Voice generations — the new
 * popover has no voice picker, and TTS requires a voice id.
 */
export const ELEVENLABS_DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'
export const PROMPT_SLUG_MAX_LENGTH = 32
/** Longest name a sound can be renamed to (keeps file names sane on export). */
export const SOUND_NAME_MAX_LENGTH = 64
/**
 * Names are truncated in the middle: this many trailing characters always
 * stay visible, so "_v2" / "_copy" / "_3" siblings never look identical.
 */
export const NAME_VISIBLE_TAIL_LENGTH = 6
/** Keys that ask to delete the focused sound row (opens the confirm dialog). */
export const DELETE_SOUND_KEYS: readonly string[] = ['Delete', 'Backspace'] as const
export const FALLBACK_SOUND_NAME = 'sound'

export const IMPORT_ACCEPT = '.wav,.mp3,audio/wav,audio/mpeg'
export const IMPORT_ALLOWED_MIME_TYPES: readonly string[] = [
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/mpeg',
  'audio/mp3',
] as const
export const IMPORT_ALLOWED_EXTENSIONS: readonly string[] = ['.wav', '.mp3'] as const

export const WAV_EXTENSION = '.wav'
export const WAV_MIME_TYPE = 'audio/wav'
export const MPEG_MIME_TYPE = 'audio/mpeg'

export const SOUND_LIBRARY_ERRORS = {
  GENERATION_FAILED: 'Couldn’t generate that sound. Try again.',
  UNSUPPORTED_IMPORT: 'Only WAV or MP3 files can be imported.',
  EXPORT_FAILED: 'Couldn’t export this sound. Try again.',
} as const
