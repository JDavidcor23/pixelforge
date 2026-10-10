import { describe, it, expect, beforeEach } from 'vitest'
import { useSoundsStore } from './sounds.store'
import {
  ADSR_DEFAULTS,
  FILTER_DEFAULTS,
  OSCILLATOR_DEFAULTS,
  MASTER_GAIN_DEFAULT,
  DEFAULT_VOLUME,
  GENERATION_HISTORY_LIMIT,
} from '@/constants/audio'
import type { AudioAsset, GenerationRecord } from '@/types/audio'

const createMockAsset = (overrides: Partial<AudioAsset> = {}): AudioAsset => ({
  id: `asset-${Date.now()}`,
  name: 'Test Sound',
  tags: ['sfx'],
  duration: 2.5,
  format: 'audio/wav',
  fileSize: 44100,
  associatedSpriteIds: [],
  createdAt: new Date().toISOString(),
  ...overrides,
})

const createMockGenerationRecord = (overrides: Partial<GenerationRecord> = {}): GenerationRecord => ({
  id: `gen-${Date.now()}`,
  mode: 'sfx',
  prompt: 'laser shot',
  resultAssetId: 'asset-1',
  timestamp: new Date().toISOString(),
  ...overrides,
})

describe('Sounds Store', () => {
  beforeEach(() => {
    useSoundsStore.setState(useSoundsStore.getInitialState())
  })

  // ── Store Creation & Defaults ──────────────────────────────────────────────

  describe('initialization', () => {
    it('creates store with correct synth defaults', () => {
      const state = useSoundsStore.getState()

      expect(state.synthParams.oscillator).toEqual(OSCILLATOR_DEFAULTS)
      expect(state.synthParams.envelope).toEqual(ADSR_DEFAULTS)
      expect(state.synthParams.filter).toEqual(FILTER_DEFAULTS)
      expect(state.synthParams.masterGain).toBe(MASTER_GAIN_DEFAULT)
    })

    it('creates store with correct library defaults', () => {
      const state = useSoundsStore.getState()

      expect(state.assets).toEqual([])
      expect(state.selectedAssetId).toBeNull()
      expect(state.searchQuery).toBe('')
      expect(state.filterTag).toBeNull()
      expect(state.sortBy).toBe('date')
      expect(state.sortDirection).toBe('desc')
      expect(state.generationHistory).toEqual([])
    })

    it('creates store with correct playback defaults', () => {
      const state = useSoundsStore.getState()

      expect(state.playbackState).toBe('idle')
      expect(state.currentTime).toBe(0)
      expect(state.duration).toBe(0)
      expect(state.volume).toBe(DEFAULT_VOLUME)
      expect(state.loop).toBe(false)
      expect(state.activeAssetId).toBeNull()
    })

    it('initializes synth state correctly', () => {
      const state = useSoundsStore.getState()

      expect(state.currentPresetId).toBeNull()
      expect(state.generatedBuffer).toBeNull()
      expect(state.isGenerating).toBe(false)
    })
  })

  // ── Synth Param Updates ────────────────────────────────────────────────────

  describe('synth params', () => {
    it('updates oscillator params immutably', () => {
      useSoundsStore.getState().setOscillatorParam('frequency', 880)

      const state = useSoundsStore.getState()
      expect(state.synthParams.oscillator.frequency).toBe(880)
      expect(state.synthParams.oscillator.type).toBe('sine')
      expect(state.synthParams.oscillator.detune).toBe(0)
    })

    it('updates oscillator type', () => {
      useSoundsStore.getState().setOscillatorParam('type', 'square')

      expect(useSoundsStore.getState().synthParams.oscillator.type).toBe('square')
    })

    it('updates envelope params immutably', () => {
      useSoundsStore.getState().setEnvelopeParam('attack', 500)

      const state = useSoundsStore.getState()
      expect(state.synthParams.envelope.attack).toBe(500)
      expect(state.synthParams.envelope.decay).toBe(ADSR_DEFAULTS.decay)
      expect(state.synthParams.envelope.sustain).toBe(ADSR_DEFAULTS.sustain)
      expect(state.synthParams.envelope.release).toBe(ADSR_DEFAULTS.release)
    })

    it('updates filter params immutably', () => {
      useSoundsStore.getState().setFilterParam('frequency', 5000)

      const state = useSoundsStore.getState()
      expect(state.synthParams.filter.frequency).toBe(5000)
      expect(state.synthParams.filter.type).toBe('lowpass')
      expect(state.synthParams.filter.q).toBe(1)
    })

    it('updates filter type', () => {
      useSoundsStore.getState().setFilterParam('type', 'highpass')

      expect(useSoundsStore.getState().synthParams.filter.type).toBe('highpass')
    })

    it('updates master gain', () => {
      useSoundsStore.getState().setMasterGain(0.5)

      expect(useSoundsStore.getState().synthParams.masterGain).toBe(0.5)
    })

    it('updates synth param at top level', () => {
      const newEnvelope = { attack: 50, decay: 100, sustain: 0.5, release: 200 }
      useSoundsStore.getState().setSynthParam('envelope', newEnvelope)

      expect(useSoundsStore.getState().synthParams.envelope).toEqual(newEnvelope)
    })

    it('sets current preset id', () => {
      useSoundsStore.getState().setCurrentPreset('preset-1')

      expect(useSoundsStore.getState().currentPresetId).toBe('preset-1')
    })

    it('sets isGenerating flag', () => {
      useSoundsStore.getState().setIsGenerating(true)

      expect(useSoundsStore.getState().isGenerating).toBe(true)
    })
  })

  // ── Reset Synth Params ─────────────────────────────────────────────────────

  describe('resetSynthParams', () => {
    it('restores all synth params to defaults', () => {
      useSoundsStore.getState().setOscillatorParam('frequency', 880)
      useSoundsStore.getState().setEnvelopeParam('attack', 1000)
      useSoundsStore.getState().setFilterParam('frequency', 10000)
      useSoundsStore.getState().setMasterGain(0.2)

      useSoundsStore.getState().resetSynthParams()

      const state = useSoundsStore.getState()
      expect(state.synthParams.oscillator).toEqual(OSCILLATOR_DEFAULTS)
      expect(state.synthParams.envelope).toEqual(ADSR_DEFAULTS)
      expect(state.synthParams.filter).toEqual(FILTER_DEFAULTS)
      expect(state.synthParams.masterGain).toBe(MASTER_GAIN_DEFAULT)
    })
  })

  // ── Asset Library ──────────────────────────────────────────────────────────

  describe('asset library', () => {
    it('adds asset prepended to array', () => {
      const asset1 = createMockAsset({ id: 'a1', name: 'First' })
      const asset2 = createMockAsset({ id: 'a2', name: 'Second' })

      useSoundsStore.getState().addAsset(asset1)
      useSoundsStore.getState().addAsset(asset2)

      const assets = useSoundsStore.getState().assets
      expect(assets).toHaveLength(2)
      expect(assets[0].id).toBe('a2')
      expect(assets[1].id).toBe('a1')
    })

    it('removes asset by id', () => {
      const asset = createMockAsset({ id: 'remove-me' })
      useSoundsStore.getState().addAsset(asset)

      useSoundsStore.getState().removeAsset('remove-me')

      expect(useSoundsStore.getState().assets).toHaveLength(0)
    })

    it('clears selectedAssetId when removing the selected asset', () => {
      const asset = createMockAsset({ id: 'selected' })
      useSoundsStore.getState().addAsset(asset)
      useSoundsStore.getState().setSelectedAsset('selected')

      useSoundsStore.getState().removeAsset('selected')

      expect(useSoundsStore.getState().selectedAssetId).toBeNull()
    })

    it('preserves selectedAssetId when removing a different asset', () => {
      const asset1 = createMockAsset({ id: 'keep' })
      const asset2 = createMockAsset({ id: 'remove' })
      useSoundsStore.getState().addAsset(asset1)
      useSoundsStore.getState().addAsset(asset2)
      useSoundsStore.getState().setSelectedAsset('keep')

      useSoundsStore.getState().removeAsset('remove')

      expect(useSoundsStore.getState().selectedAssetId).toBe('keep')
    })

    it('updates asset partially', () => {
      const asset = createMockAsset({ id: 'update-me', name: 'Original' })
      useSoundsStore.getState().addAsset(asset)

      useSoundsStore.getState().updateAsset('update-me', { name: 'Updated' })

      const updated = useSoundsStore.getState().assets.find((a) => a.id === 'update-me')
      expect(updated?.name).toBe('Updated')
      expect(updated?.duration).toBe(asset.duration)
    })
  })

  // ── Search & Filter ────────────────────────────────────────────────────────

  describe('search and filter', () => {
    it('sets search query', () => {
      useSoundsStore.getState().setSearchQuery('laser')

      expect(useSoundsStore.getState().searchQuery).toBe('laser')
    })

    it('sets filter tag', () => {
      useSoundsStore.getState().setFilterTag('sfx')

      expect(useSoundsStore.getState().filterTag).toBe('sfx')
    })

    it('clears filter tag with null', () => {
      useSoundsStore.getState().setFilterTag('music')
      useSoundsStore.getState().setFilterTag(null)

      expect(useSoundsStore.getState().filterTag).toBeNull()
    })

    it('sets sort field', () => {
      useSoundsStore.getState().setSortBy('name')

      expect(useSoundsStore.getState().sortBy).toBe('name')
    })

    it('sets sort direction', () => {
      useSoundsStore.getState().setSortDirection('asc')

      expect(useSoundsStore.getState().sortDirection).toBe('asc')
    })
  })

  // ── Generation History ─────────────────────────────────────────────────────

  describe('generation history', () => {
    it('adds generation record prepended', () => {
      const r1 = createMockGenerationRecord({ id: 'r1' })
      const r2 = createMockGenerationRecord({ id: 'r2' })

      useSoundsStore.getState().addGenerationRecord(r1)
      useSoundsStore.getState().addGenerationRecord(r2)

      const history = useSoundsStore.getState().generationHistory
      expect(history[0].id).toBe('r2')
      expect(history[1].id).toBe('r1')
    })

    it('caps generation history at GENERATION_HISTORY_LIMIT (FIFO)', () => {
      for (let i = 0; i < GENERATION_HISTORY_LIMIT + 5; i++) {
        useSoundsStore.getState().addGenerationRecord(
          createMockGenerationRecord({ id: `r-${i}` })
        )
      }

      const history = useSoundsStore.getState().generationHistory
      expect(history).toHaveLength(GENERATION_HISTORY_LIMIT)
      expect(history[0].id).toBe(`r-${GENERATION_HISTORY_LIMIT + 4}`)
    })

    it('clears generation history', () => {
      useSoundsStore.getState().addGenerationRecord(createMockGenerationRecord())

      useSoundsStore.getState().clearGenerationHistory()

      expect(useSoundsStore.getState().generationHistory).toEqual([])
    })
  })

  // ── Playback State ─────────────────────────────────────────────────────────

  describe('playback', () => {
    it('transitions playback state', () => {
      useSoundsStore.getState().setPlaybackState('playing')
      expect(useSoundsStore.getState().playbackState).toBe('playing')

      useSoundsStore.getState().setPlaybackState('paused')
      expect(useSoundsStore.getState().playbackState).toBe('paused')

      useSoundsStore.getState().setPlaybackState('idle')
      expect(useSoundsStore.getState().playbackState).toBe('idle')
    })

    it('sets current time', () => {
      useSoundsStore.getState().setCurrentTime(5.3)

      expect(useSoundsStore.getState().currentTime).toBe(5.3)
    })

    it('sets duration', () => {
      useSoundsStore.getState().setDuration(10.5)

      expect(useSoundsStore.getState().duration).toBe(10.5)
    })

    it('sets active asset', () => {
      useSoundsStore.getState().setActiveAsset('asset-1')

      expect(useSoundsStore.getState().activeAssetId).toBe('asset-1')
    })

    it('resets playback to idle state', () => {
      useSoundsStore.getState().setPlaybackState('playing')
      useSoundsStore.getState().setCurrentTime(5.0)
      useSoundsStore.getState().setActiveAsset('asset-1')

      useSoundsStore.getState().resetPlayback()

      const state = useSoundsStore.getState()
      expect(state.playbackState).toBe('idle')
      expect(state.currentTime).toBe(0)
      expect(state.activeAssetId).toBeNull()
    })
  })

  // ── Volume & Loop ──────────────────────────────────────────────────────────

  describe('volume and loop', () => {
    it('sets volume', () => {
      useSoundsStore.getState().setVolume(0.5)

      expect(useSoundsStore.getState().volume).toBe(0.5)
    })

    it('sets loop', () => {
      useSoundsStore.getState().setLoop(true)

      expect(useSoundsStore.getState().loop).toBe(true)
    })

    it('toggles loop off', () => {
      useSoundsStore.getState().setLoop(true)
      useSoundsStore.getState().setLoop(false)

      expect(useSoundsStore.getState().loop).toBe(false)
    })
  })
})
