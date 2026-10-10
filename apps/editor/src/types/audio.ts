import type { LucideIcon } from 'lucide-react'

// ── Audio Domain Types ───────────────────────────────────────────────────────

export type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle' | 'white-noise'

export type FilterType = 'lowpass' | 'highpass' | 'bandpass'

export type PlaybackState = 'idle' | 'playing' | 'paused'

export type ElevenLabsMode = 'sfx' | 'music' | 'tts'

export type AudioAssetTag = 'sfx' | 'music' | 'dialog'

export type SortField = 'name' | 'date' | 'duration'

export type SortDirection = 'asc' | 'desc'

/** How an asset came to exist. Optional on AudioAsset; old data reads as 'import'. */
export type AudioAssetSource = 'synth' | 'ai' | 'import'

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
  /** Origin of the sound. Missing on legacy assets — treat as 'import'. */
  source?: AudioAssetSource
  /** Synth recipe, present only for synth-sourced assets (drives Tweak + variations). */
  synthParams?: SynthParameters
  /** Preset the synth recipe started from (e.g. 'preset-coin'). */
  presetId?: string
  /** AI prompt the asset was generated from. */
  prompt?: string
  /** Normalized (0..1) amplitude peaks, WAVE_PEAK_COUNT long, for waveform drawing. */
  peaks?: number[]
}

// ── Synth Preset ─────────────────────────────────────────────────────────────

export type PresetCategory = 'laser' | 'explosion' | 'jump' | 'coin' | 'powerup' | 'hit'

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

// ── Sound Library UI ─────────────────────────────────────────────────────────

/** Friendly Tweak sliders, each mapped onto one or more synth parameters. */
export type TweakParamKey = 'pitch' | 'length' | 'punch' | 'tone'

export type TweakValues = Record<TweakParamKey, number>

/** Which section of the New Sound popover receives focus when it opens. */
export type NewSoundSection = 'presets' | 'ai'

export interface NewSoundRequest {
  section: NewSoundSection
  prompt: string
  mode: ElevenLabsMode
}

/** An AI generation in flight — rendered as a non-selectable row atop the library. */
export interface PendingGeneration {
  id: string
  prompt: string
  mode: ElevenLabsMode
}

export type VariationCardState = 'idle' | 'busy' | 'disabled'

export type VariationCardTone = 'accent' | 'ai'

/** What the library list shows: the empty library, a filter miss, or rows. */
export type LibraryListState = 'empty' | 'no-results' | 'list'

export type LibraryEmptyVariant = Exclude<LibraryListState, 'list'>

export interface PresetTileDefinition {
  presetId: string
  label: string
  icon: LucideIcon
}

export interface TweakParamDefinition {
  key: TweakParamKey
  label: string
  lo: string
  hi: string
}

/** A synth/AI/imported sound, decoded and encoded, ready to become an asset. */
export interface RenderedSound {
  buffer: AudioBuffer
  blob: Blob
  url: string
  peaks: number[]
  duration: number
}
