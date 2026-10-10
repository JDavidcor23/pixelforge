import type {
  AudioAsset,
  AudioAssetSource,
  AudioAssetTag,
  GenerationRecord,
  RenderedSound,
  SynthParameters,
} from '@/types/audio'
import { ADSR_LIMITS, FILTER_LIMITS, OSCILLATOR_LIMITS } from '@/constants/audio'
import {
  DEFAULT_SOUND_KIND,
  FALLBACK_SOUND_NAME,
  LONG_DURATION_DECIMALS,
  LONG_DURATION_THRESHOLD_S,
  SECONDS_PER_HOUR,
  SECONDS_PER_MINUTE,
  SOUND_NAME_MAX_LENGTH,
  SOUND_KIND_LABELS,
  TIME_DECIMALS,
  VARIATION_SPREAD,
  WAV_MIME_TYPE,
  WAVE_PEAK_COUNT,
} from '@/constants/sound-library'
import { audioEngine, calculateDefaultDuration } from './audio-engine'
import { encodeWav } from './audio-encoder'
import { computePeaks } from './audio-peaks'

// ── Rendering ────────────────────────────────────────────────────────────────

/** Wraps a decoded buffer + its encoded blob into everything an asset needs. */
export function describeSound(buffer: AudioBuffer, blob: Blob): RenderedSound {
  return {
    buffer,
    blob,
    url: URL.createObjectURL(blob),
    peaks: computePeaks(buffer, WAVE_PEAK_COUNT),
    duration: buffer.duration,
  }
}

/** Renders a synth recipe offline and encodes it as WAV. */
export async function renderSynthSound(params: SynthParameters): Promise<RenderedSound> {
  const buffer = await audioEngine.renderToBuffer(params, calculateDefaultDuration(params))
  return describeSound(buffer, encodeWav(buffer))
}

interface NewAssetInput {
  name: string
  tags: string[]
  source: AudioAssetSource
  rendered: RenderedSound
  format?: string
  synthParams?: SynthParameters
  presetId?: string
  prompt?: string
}

export function buildAsset(input: NewAssetInput): AudioAsset {
  return {
    id: crypto.randomUUID(),
    name: input.name,
    tags: input.tags,
    duration: input.rendered.duration,
    format: input.format ?? WAV_MIME_TYPE,
    fileSize: input.rendered.blob.size,
    localObjectUrl: input.rendered.url,
    associatedSpriteIds: [],
    createdAt: new Date().toISOString(),
    source: input.source,
    synthParams: input.synthParams,
    presetId: input.presetId,
    prompt: input.prompt,
    peaks: input.rendered.peaks,
  }
}

const BLOB_URL_PREFIX = 'blob:'

/**
 * Revokes a `blob:` URL once no asset references it anymore. Duplicates share
 * their original's URL, so a still-referenced URL must survive.
 */
export function releaseObjectUrl(
  url: string | undefined,
  remainingAssets: readonly AudioAsset[]
): void {
  if (!url?.startsWith(BLOB_URL_PREFIX)) return
  if (remainingAssets.some((asset) => asset.localObjectUrl === url)) return
  URL.revokeObjectURL(url)
}

// ── Naming ───────────────────────────────────────────────────────────────────

const NON_ALPHANUMERIC = /[^a-z0-9]+/g
const EDGE_UNDERSCORES = /^_+|_+$/g
const TRAILING_UNDERSCORES = /_+$/g
const NAME_SEPARATOR = '_'

/** "Wooden door creaking!" → "wooden_door_creaking" */
export function slugify(text: string, maxLength: number): string {
  const slug = text
    .toLowerCase()
    .replace(NON_ALPHANUMERIC, NAME_SEPARATOR)
    .replace(EDGE_UNDERSCORES, '')
    .slice(0, maxLength)
    .replace(TRAILING_UNDERSCORES, '')
  return slug || FALLBACK_SOUND_NAME
}

/** Returns `base`, or `base_2`, `base_3`… — whichever is not taken yet. */
export function buildUniqueName(base: string, existingNames: readonly string[]): string {
  const taken = new Set(existingNames)
  if (!taken.has(base)) return base
  let index = 2
  while (taken.has(`${base}${NAME_SEPARATOR}${index}`)) index++
  return `${base}${NAME_SEPARATOR}${index}`
}

/** Appends `suffix`, trimming the base so the result stays within the name limit. */
export function withNameSuffix(base: string, suffix: string): string {
  return `${base.slice(0, Math.max(0, SOUND_NAME_MAX_LENGTH - suffix.length))}${suffix}`
}

// ── Classification ───────────────────────────────────────────────────────────

const KIND_TAGS = Object.keys(SOUND_KIND_LABELS) as AudioAssetTag[]

export function getAssetKind(asset: AudioAsset): AudioAssetTag {
  return KIND_TAGS.find((tag) => asset.tags.includes(tag)) ?? DEFAULT_SOUND_KIND
}

export function getAssetKindLabel(asset: AudioAsset): string {
  return SOUND_KIND_LABELS[getAssetKind(asset)]
}

/**
 * Legacy assets have no `source`: an asset that appears in the generation
 * history was made with AI, anything else is treated as imported.
 */
export function getAssetSource(
  asset: AudioAsset,
  generationHistory: readonly GenerationRecord[]
): AudioAssetSource {
  if (asset.source) return asset.source
  if (generationHistory.some((record) => record.resultAssetId === asset.id)) return 'ai'
  return 'import'
}

// ── Formatting ───────────────────────────────────────────────────────────────

/** 0.523 → "0.52", 48 → "48.0" (no unit). */
export function formatSeconds(seconds: number): string {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0
  const decimals = safe >= LONG_DURATION_THRESHOLD_S ? LONG_DURATION_DECIMALS : TIME_DECIMALS
  return safe.toFixed(decimals)
}

const pad2 = (value: number): string => String(value).padStart(2, '0')

/**
 * Human duration with its unit: "0.52s", "48.0s", then clock style once it
 * passes a minute ("2:05", "1:02:05") so long music never reads "3725.0s".
 */
export function formatDuration(seconds: number): string {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0
  if (safe < SECONDS_PER_MINUTE) return `${formatSeconds(safe)}s`
  const whole = Math.floor(safe)
  const hours = Math.floor(whole / SECONDS_PER_HOUR)
  const minutes = Math.floor((whole % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE)
  const secs = whole % SECONDS_PER_MINUTE
  return hours > 0 ? `${hours}:${pad2(minutes)}:${pad2(secs)}` : `${minutes}:${pad2(secs)}`
}

/**
 * Splits a name for middle truncation: `head` may ellipsize, `tail` is always
 * shown. Short names come back whole in `head`.
 */
export function splitNameForTruncation(
  name: string,
  tailLength: number
): { head: string; tail: string } {
  if (name.length <= tailLength * 2) return { head: name, tail: '' }
  return { head: name.slice(0, -tailLength), tail: name.slice(-tailLength) }
}

// ── Variations ───────────────────────────────────────────────────────────────

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

/** Small random drift that keeps the character of the original recipe. */
export function perturbSynthParams(
  params: SynthParameters,
  random: () => number = Math.random
): SynthParameters {
  const signed = () => random() * 2 - 1
  const drift = (value: number, spread: number, limits: { min: number; max: number }) =>
    Math.round(clamp(value * (1 + signed() * spread), limits.min, limits.max))

  return {
    ...params,
    oscillator: {
      ...params.oscillator,
      frequency: drift(params.oscillator.frequency, VARIATION_SPREAD.FREQUENCY, OSCILLATOR_LIMITS.frequency),
      detune: Math.round(
        clamp(
          params.oscillator.detune + signed() * VARIATION_SPREAD.DETUNE_CENTS,
          OSCILLATOR_LIMITS.detune.min,
          OSCILLATOR_LIMITS.detune.max
        )
      ),
    },
    envelope: {
      ...params.envelope,
      attack: drift(params.envelope.attack, VARIATION_SPREAD.ENVELOPE, ADSR_LIMITS.attack),
      decay: drift(params.envelope.decay, VARIATION_SPREAD.ENVELOPE, ADSR_LIMITS.decay),
      release: drift(params.envelope.release, VARIATION_SPREAD.ENVELOPE, ADSR_LIMITS.release),
    },
    filter: {
      ...params.filter,
      frequency: drift(params.filter.frequency, VARIATION_SPREAD.FILTER, FILTER_LIMITS.frequency),
    },
  }
}

export function areSynthParamsEqual(a: SynthParameters, b: SynthParameters): boolean {
  return (
    a.masterGain === b.masterGain &&
    a.oscillator.type === b.oscillator.type &&
    a.oscillator.frequency === b.oscillator.frequency &&
    a.oscillator.detune === b.oscillator.detune &&
    a.envelope.attack === b.envelope.attack &&
    a.envelope.decay === b.envelope.decay &&
    a.envelope.sustain === b.envelope.sustain &&
    a.envelope.release === b.envelope.release &&
    a.filter.type === b.filter.type &&
    a.filter.frequency === b.filter.frequency &&
    a.filter.q === b.filter.q
  )
}
