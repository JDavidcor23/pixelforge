import type { SynthParameters, TweakParamKey, TweakValues } from '@/types/audio'
import { DEFAULT_DECAY_SHARE, TWEAK_RANGES, TWEAK_SLIDER } from '@/constants/sound-library'

/**
 * Maps the four friendly Tweak sliders (0..TWEAK_SLIDER.MAX) onto real synth
 * parameters and back. Every axis is logarithmic: pitch, time and cutoff are
 * all perceived on a log scale, so equal slider steps sound like equal changes.
 */

interface Range {
  readonly min: number
  readonly max: number
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

function toPosition(value: number, range: Range): number {
  const safe = clamp(value, range.min, range.max)
  const ratio = (Math.log(safe) - Math.log(range.min)) / (Math.log(range.max) - Math.log(range.min))
  return Math.round(ratio * TWEAK_SLIDER.MAX)
}

function fromPosition(position: number, range: Range): number {
  const ratio = clamp(position, TWEAK_SLIDER.MIN, TWEAK_SLIDER.MAX) / TWEAK_SLIDER.MAX
  return Math.round(Math.exp(Math.log(range.min) + ratio * (Math.log(range.max) - Math.log(range.min))))
}

export function synthParamsToTweaks(params: SynthParameters): TweakValues {
  const { oscillator, envelope, filter } = params
  return {
    pitch: toPosition(oscillator.frequency, TWEAK_RANGES.PITCH_HZ),
    length: toPosition(envelope.decay + envelope.release, TWEAK_RANGES.LENGTH_MS),
    punch: TWEAK_SLIDER.MAX - toPosition(envelope.attack, TWEAK_RANGES.ATTACK_MS),
    tone: toPosition(filter.frequency, TWEAK_RANGES.TONE_HZ),
  }
}

export function applyTweak(
  params: SynthParameters,
  key: TweakParamKey,
  position: number
): SynthParameters {
  switch (key) {
    case 'pitch':
      return {
        ...params,
        oscillator: { ...params.oscillator, frequency: fromPosition(position, TWEAK_RANGES.PITCH_HZ) },
      }
    case 'length': {
      const total = fromPosition(position, TWEAK_RANGES.LENGTH_MS)
      const current = params.envelope.decay + params.envelope.release
      const decayShare = current > 0 ? params.envelope.decay / current : DEFAULT_DECAY_SHARE
      const decay = Math.round(total * decayShare)
      return {
        ...params,
        envelope: { ...params.envelope, decay, release: total - decay },
      }
    }
    case 'punch':
      return {
        ...params,
        envelope: {
          ...params.envelope,
          attack: fromPosition(TWEAK_SLIDER.MAX - position, TWEAK_RANGES.ATTACK_MS),
        },
      }
    case 'tone':
      return {
        ...params,
        filter: { ...params.filter, frequency: fromPosition(position, TWEAK_RANGES.TONE_HZ) },
      }
  }
}
