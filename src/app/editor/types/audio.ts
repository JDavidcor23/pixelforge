// ── Audio Domain Types ───────────────────────────────────────────────────────

export type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle' | 'white-noise'

export type FilterType = 'lowpass' | 'highpass' | 'bandpass'

export type PlaybackState = 'idle' | 'playing' | 'paused'

export type ElevenLabsMode = 'sfx' | 'music' | 'tts'

export type AudioAssetTag = 'sfx' | 'music' | 'dialog'

export type SortField = 'name' | 'date' | 'duration'

export type SortDirection = 'asc' | 'desc'

// ── Synth Parameters ─────────────────────────────────────────────────────────

export interface OscillatorParameters {
  type: OscillatorType
  frequency: number
  detune: number
}

export interface EnvelopeParameters {
  attack: number
  decay: number
  sustain: number
  release: number
}

export interface FilterParameters {
  type: FilterType
  frequency: number
  q: number
}

export interface SynthParameters {
  oscillator: OscillatorParameters
  envelope: EnvelopeParameters
  filter: FilterParameters
  masterGain: number
}

// ── Audio Asset ──────────────────────────────────────────────────────────────

export interface AudioAsset {
  id: string
  name: string
  tags: string[]
  duration: number
  format: string
  fileSize: number
  supabaseUrl?: string
  localObjectUrl?: string
  associatedSpriteIds: string[]
  createdAt: string
}

// ── Synth Preset ─────────────────────────────────────────────────────────────

export type PresetCategory = 'laser' | 'explosion' | 'jump' | 'coin' | 'powerup'

export interface SynthPreset {
  id: string
  name: string
  category: PresetCategory
  params: SynthParameters
}

// ── Generation Record ────────────────────────────────────────────────────────

export interface GenerationRecord {
  id: string
  mode: ElevenLabsMode
  prompt: string
  referenceTrackName?: string
  voiceId?: string
  resultAssetId: string
  timestamp: string
}
