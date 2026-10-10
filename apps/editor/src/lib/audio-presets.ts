import type { SynthPreset, PresetCategory } from '@/types/audio'

export const SYNTH_PRESETS: SynthPreset[] = [
  {
    id: 'preset-laser',
    name: 'Laser',
    category: 'laser',
    params: {
      oscillator: { type: 'sawtooth', frequency: 1200, detune: 0 },
      envelope: { attack: 10, decay: 100, sustain: 0.3, release: 200 },
      filter: { type: 'highpass', frequency: 800, q: 5 },
      masterGain: 0.7,
    },
  },
  {
    id: 'preset-explosion',
    name: 'Explosion',
    category: 'explosion',
    params: {
      oscillator: { type: 'white-noise', frequency: 80, detune: 0 },
      envelope: { attack: 5, decay: 600, sustain: 0.2, release: 800 },
      filter: { type: 'lowpass', frequency: 400, q: 2 },
      masterGain: 0.9,
    },
  },
  {
    id: 'preset-jump',
    name: 'Jump',
    category: 'jump',
    params: {
      oscillator: { type: 'sine', frequency: 260, detune: 80 },
      envelope: { attack: 5, decay: 80, sustain: 0.4, release: 150 },
      filter: { type: 'lowpass', frequency: 3000, q: 1 },
      masterGain: 0.6,
    },
  },
  {
    id: 'preset-coin',
    name: 'Coin',
    category: 'coin',
    params: {
      oscillator: { type: 'triangle', frequency: 1800, detune: 0 },
      envelope: { attack: 5, decay: 50, sustain: 0.1, release: 100 },
      filter: { type: 'highpass', frequency: 1000, q: 3 },
      masterGain: 0.5,
    },
  },
  {
    id: 'preset-powerup',
    name: 'Power Up',
    category: 'powerup',
    params: {
      oscillator: { type: 'square', frequency: 440, detune: 50 },
      envelope: { attack: 50, decay: 200, sustain: 0.6, release: 400 },
      filter: { type: 'lowpass', frequency: 5000, q: 2 },
      masterGain: 0.65,
    },
  },
]

export function getPresetById(id: string): SynthPreset | undefined {
  return SYNTH_PRESETS.find((preset) => preset.id === id)
}

export function getPresetsByCategory(category: PresetCategory): SynthPreset[] {
  return SYNTH_PRESETS.filter((preset) => preset.category === category)
}

export function getAllPresets(): SynthPreset[] {
  return [...SYNTH_PRESETS]
}
