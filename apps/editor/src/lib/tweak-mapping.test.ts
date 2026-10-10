import { describe, expect, it } from 'vitest'

import { applyTweak, synthParamsToTweaks } from './tweak-mapping'
import { resamplePeaks } from './audio-peaks'
import {
  buildUniqueName,
  formatDuration,
  formatSeconds,
  perturbSynthParams,
  slugify,
  splitNameForTruncation,
} from './sound-assets'
import { getPresetById } from './audio-presets'
import { TWEAK_RANGES, TWEAK_SLIDER } from '@/constants/sound-library'
import type { SynthParameters } from '@/types/audio'

const coin = getPresetById('preset-coin')?.params as SynthParameters

describe('tweak mapping', () => {
  it('round-trips each slider position through the synth params', () => {
    for (const key of ['pitch', 'length', 'punch', 'tone'] as const) {
      const tweaked = applyTweak(coin, key, 70)
      expect(Math.abs(synthParamsToTweaks(tweaked)[key] - 70)).toBeLessThanOrEqual(1)
    }
  })

  it('maps the slider ends onto the configured ranges', () => {
    expect(applyTweak(coin, 'pitch', TWEAK_SLIDER.MIN).oscillator.frequency).toBe(TWEAK_RANGES.PITCH_HZ.min)
    expect(applyTweak(coin, 'tone', TWEAK_SLIDER.MAX).filter.frequency).toBe(TWEAK_RANGES.TONE_HZ.max)
  })

  it('punch is inverse attack: more punch, shorter attack', () => {
    const soft = applyTweak(coin, 'punch', 10).envelope.attack
    const hard = applyTweak(coin, 'punch', 90).envelope.attack
    expect(hard).toBeLessThan(soft)
  })

  it('length keeps the decay/release ratio', () => {
    const longer = applyTweak(coin, 'length', 90).envelope
    const ratio = coin.envelope.decay / (coin.envelope.decay + coin.envelope.release)
    expect(longer.decay / (longer.decay + longer.release)).toBeCloseTo(ratio, 1)
  })
})

describe('sound asset helpers', () => {
  it('slugifies prompts and keeps names unique', () => {
    expect(slugify('Wooden door, creaking!', 32)).toBe('wooden_door_creaking')
    expect(buildUniqueName('coin', ['coin', 'coin_2'])).toBe('coin_3')
  })

  it('formats durations like the spec', () => {
    expect(formatSeconds(0.523)).toBe('0.52')
    expect(formatSeconds(48)).toBe('48.0')
  })

  it('formats durations with units and switches to clock style past a minute', () => {
    expect(formatDuration(0)).toBe('0.00s')
    expect(formatDuration(Number.NaN)).toBe('0.00s')
    expect(formatDuration(0.523)).toBe('0.52s')
    expect(formatDuration(48)).toBe('48.0s')
    expect(formatDuration(125.7)).toBe('2:05')
    expect(formatDuration(3725)).toBe('1:02:05')
  })

  it('keeps the tail of long names visible for middle truncation', () => {
    expect(splitNameForTruncation('coin', 6)).toEqual({ head: 'coin', tail: '' })
    expect(splitNameForTruncation('wooden_door_creaking_open_v2', 6)).toEqual({
      head: 'wooden_door_creaking_o',
      tail: 'pen_v2',
    })
  })

  it('perturbs params deterministically with a fixed random source', () => {
    const same = perturbSynthParams(coin, () => 0.5)
    expect(same.oscillator.frequency).toBe(coin.oscillator.frequency)
  })

  it('resamples peaks keeping each bucket max', () => {
    expect(resamplePeaks([0.1, 0.9, 0.2, 0.4], 2)).toEqual([0.9, 0.4])
  })
})
