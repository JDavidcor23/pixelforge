import type { OscillatorType, FilterType, FilterParameters, OscillatorParameters, EnvelopeParameters } from '@/types/audio'

// ── Oscillator & Filter Type Arrays ──────────────────────────────────────────

export const OSCILLATOR_TYPES: OscillatorType[] = [
  'sine',
  'square',
  'sawtooth',
  'triangle',
  'white-noise',
] as const

export const FILTER_TYPES: FilterType[] = [
  'lowpass',
  'highpass',
  'bandpass',
] as const

// ── ADSR Envelope ────────────────────────────────────────────────────────────

export const ADSR_DEFAULTS: EnvelopeParameters = {
  attack: 100,
  decay: 200,
  sustain: 0.7,
  release: 300,
} as const

export const ADSR_LIMITS = {
  attack: { min: 0, max: 5000 },
  decay: { min: 0, max: 5000 },
  sustain: { min: 0, max: 1 },
  release: { min: 0, max: 5000 },
} as const

// ── Filter ───────────────────────────────────────────────────────────────────

export const FILTER_DEFAULTS: FilterParameters = {
  type: 'lowpass',
  frequency: 2000,
  q: 1,
} as const

export const FILTER_LIMITS = {
  frequency: { min: 20, max: 20000 },
  q: { min: 0.1, max: 30 },
} as const

// ── Oscillator ───────────────────────────────────────────────────────────────

export const OSCILLATOR_DEFAULTS: OscillatorParameters = {
  type: 'sine',
  frequency: 440,
  detune: 0,
} as const

export const OSCILLATOR_LIMITS = {
  frequency: { min: 20, max: 20000 },
  detune: { min: -100, max: 100 },
} as const

// ── Master Gain ──────────────────────────────────────────────────────────────

export const MASTER_GAIN_DEFAULT = 0.8

// ── File & Format Constraints ────────────────────────────────────────────────

export const MAX_REFERENCE_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export const SUPPORTED_AUDIO_FORMATS = [
  'audio/wav',
  'audio/mpeg',
  'audio/ogg',
] as const

export const SUPPORTED_AUDIO_EXTENSIONS = [
  '.wav',
  '.mp3',
  '.ogg',
] as const

// ── Generation ───────────────────────────────────────────────────────────────

export const GENERATION_HISTORY_LIMIT = 20

export const MAX_SFX_DURATION = 30

export const MAX_MUSIC_DURATION = 180

// ── Storage & Persistence ────────────────────────────────────────────────────

export const AUDIO_STORAGE_BUCKET = 'audio-assets'

export const SOUNDS_STORE_KEY = 'sound-editor-core'

// ── Playback ─────────────────────────────────────────────────────────────────

export const DEFAULT_VOLUME = 0.8

// ── API ──────────────────────────────────────────────────────────────────────

export const ELEVENLABS_API_TIMEOUT = 60000
