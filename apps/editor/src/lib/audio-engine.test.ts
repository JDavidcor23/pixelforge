import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { SynthParameters } from '@/types/audio'

// ── Web Audio API Mocks ──────────────────────────────────────────────────────

function createMockGainNode() {
  return {
    gain: {
      value: 1,
      setValueAtTime: vi.fn().mockReturnThis(),
      linearRampToValueAtTime: vi.fn().mockReturnThis(),
    },
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn(),
  }
}

function createMockOscillatorNode() {
  return {
    type: 'sine' as OscillatorType,
    frequency: {
      value: 440,
      setValueAtTime: vi.fn(),
    },
    detune: {
      value: 0,
      setValueAtTime: vi.fn(),
    },
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    onended: null as (() => void) | null,
  }
}

function createMockBufferSourceNode() {
  return {
    buffer: null as AudioBuffer | null,
    loop: false,
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    onended: null as (() => void) | null,
  }
}

function createMockBiquadFilterNode() {
  return {
    type: 'lowpass' as BiquadFilterType,
    frequency: {
      value: 350,
      setValueAtTime: vi.fn(),
    },
    Q: {
      value: 1,
      setValueAtTime: vi.fn(),
    },
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn(),
  }
}

function createMockAnalyserNode() {
  return {
    fftSize: 2048,
    smoothingTimeConstant: 0.8,
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn(),
  }
}

function createMockAudioBuffer() {
  const channelData = new Float32Array(44100)
  return {
    sampleRate: 44100,
    numberOfChannels: 1,
    length: 44100,
    duration: 1,
    getChannelData: vi.fn().mockReturnValue(channelData),
  }
}

// ── Test Fixtures ────────────────────────────────────────────────────────────

const TEST_PARAMS: SynthParameters = {
  oscillator: { type: 'sawtooth', frequency: 440, detune: 0 },
  envelope: { attack: 100, decay: 200, sustain: 0.7, release: 300 },
  filter: { type: 'lowpass', frequency: 2000, q: 1 },
  masterGain: 0.8,
}

const NOISE_PARAMS: SynthParameters = {
  oscillator: { type: 'white-noise', frequency: 100, detune: 0 },
  envelope: { attack: 10, decay: 100, sustain: 0.5, release: 200 },
  filter: { type: 'highpass', frequency: 500, q: 2 },
  masterGain: 0.6,
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('AudioEngine', () => {
  let mockCtxInstance: ReturnType<typeof createMockContextInstance>
  let mockOfflineCtxInstance: ReturnType<typeof createMockOfflineInstance>

  function createMockContextInstance(stateOverride: string = 'running') {
    return {
      state: stateOverride,
      currentTime: 0,
      sampleRate: 44100,
      destination: { maxChannelCount: 2 },
      createOscillator: vi.fn().mockReturnValue(createMockOscillatorNode()),
      createGain: vi.fn().mockReturnValue(createMockGainNode()),
      createBiquadFilter: vi.fn().mockReturnValue(createMockBiquadFilterNode()),
      createAnalyser: vi.fn().mockReturnValue(createMockAnalyserNode()),
      createBufferSource: vi.fn().mockReturnValue(createMockBufferSourceNode()),
      createBuffer: vi.fn().mockReturnValue(createMockAudioBuffer()),
      resume: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
    }
  }

  function createMockOfflineInstance() {
    return {
      sampleRate: 44100,
      currentTime: 0,
      destination: { maxChannelCount: 2 },
      createOscillator: vi.fn().mockReturnValue(createMockOscillatorNode()),
      createGain: vi.fn().mockReturnValue(createMockGainNode()),
      createBiquadFilter: vi.fn().mockReturnValue(createMockBiquadFilterNode()),
      createBufferSource: vi.fn().mockReturnValue(createMockBufferSourceNode()),
      createBuffer: vi.fn().mockReturnValue(createMockAudioBuffer()),
      startRendering: vi.fn().mockResolvedValue(createMockAudioBuffer()),
    }
  }

  beforeEach(() => {
    mockCtxInstance = createMockContextInstance()
    mockOfflineCtxInstance = createMockOfflineInstance()

    // Use class-based mocks so `new AudioContext()` works
    vi.stubGlobal(
      'AudioContext',
      class MockAudioContext {
        state = mockCtxInstance.state
        currentTime = mockCtxInstance.currentTime
        sampleRate = mockCtxInstance.sampleRate
        destination = mockCtxInstance.destination
        createOscillator = mockCtxInstance.createOscillator
        createGain = mockCtxInstance.createGain
        createBiquadFilter = mockCtxInstance.createBiquadFilter
        createAnalyser = mockCtxInstance.createAnalyser
        createBufferSource = mockCtxInstance.createBufferSource
        createBuffer = mockCtxInstance.createBuffer
        resume = mockCtxInstance.resume
        close = mockCtxInstance.close
      }
    )

    vi.stubGlobal(
      'OfflineAudioContext',
      class MockOfflineAudioContext {
        sampleRate = mockOfflineCtxInstance.sampleRate
        currentTime = mockOfflineCtxInstance.currentTime
        destination = mockOfflineCtxInstance.destination
        createOscillator = mockOfflineCtxInstance.createOscillator
        createGain = mockOfflineCtxInstance.createGain
        createBiquadFilter = mockOfflineCtxInstance.createBiquadFilter
        createBufferSource = mockOfflineCtxInstance.createBufferSource
        createBuffer = mockOfflineCtxInstance.createBuffer
        startRendering = mockOfflineCtxInstance.startRendering
      }
    )
  })

  afterEach(async () => {
    vi.resetModules()
    vi.unstubAllGlobals()
  })

  async function getEngine() {
    const mod = await import('@/lib/audio-engine')
    return new mod.AudioEngine()
  }

  describe('lazy initialization', () => {
    it('does not create AudioContext at construction time', async () => {
      const mod = await import('@/lib/audio-engine')
      const _engine = new mod.AudioEngine()
      // The instance should not have triggered AudioContext creation
      expect(mockCtxInstance.createOscillator).not.toHaveBeenCalled()
    })

    it('creates AudioContext on first getContext() call', async () => {
      const engine = await getEngine()
      const ctx = engine.getContext()
      expect(ctx).toBeDefined()
      expect(ctx.sampleRate).toBe(44100)
    })

    it('returns the same context on subsequent calls', async () => {
      const engine = await getEngine()
      const ctx1 = engine.getContext()
      const ctx2 = engine.getContext()
      expect(ctx1).toBe(ctx2)
    })
  })

  describe('isSuspended', () => {
    it('returns false when no context exists', async () => {
      const engine = await getEngine()
      expect(engine.isSuspended()).toBe(false)
    })

    it('returns false when context is running', async () => {
      const engine = await getEngine()
      engine.getContext()
      expect(engine.isSuspended()).toBe(false)
    })

    it('returns true when context is suspended', async () => {
      mockCtxInstance = createMockContextInstance('suspended')

      vi.stubGlobal(
        'AudioContext',
        class MockAudioContextSuspended {
          state = mockCtxInstance.state
          currentTime = mockCtxInstance.currentTime
          sampleRate = mockCtxInstance.sampleRate
          destination = mockCtxInstance.destination
          createOscillator = mockCtxInstance.createOscillator
          createGain = mockCtxInstance.createGain
          createBiquadFilter = mockCtxInstance.createBiquadFilter
          createAnalyser = mockCtxInstance.createAnalyser
          createBufferSource = mockCtxInstance.createBufferSource
          createBuffer = mockCtxInstance.createBuffer
          resume = mockCtxInstance.resume
          close = mockCtxInstance.close
        }
      )

      const engine = await getEngine()
      engine.getContext()
      expect(engine.isSuspended()).toBe(true)
    })
  })

  describe('resume', () => {
    it('calls context.resume() when suspended', async () => {
      mockCtxInstance = createMockContextInstance('suspended')

      vi.stubGlobal(
        'AudioContext',
        class MockAudioContextSuspended {
          state = mockCtxInstance.state
          currentTime = mockCtxInstance.currentTime
          sampleRate = mockCtxInstance.sampleRate
          destination = mockCtxInstance.destination
          createOscillator = mockCtxInstance.createOscillator
          createGain = mockCtxInstance.createGain
          createBiquadFilter = mockCtxInstance.createBiquadFilter
          createAnalyser = mockCtxInstance.createAnalyser
          createBufferSource = mockCtxInstance.createBufferSource
          createBuffer = mockCtxInstance.createBuffer
          resume = mockCtxInstance.resume
          close = mockCtxInstance.close
        }
      )

      const engine = await getEngine()
      await engine.resume()
      expect(mockCtxInstance.resume).toHaveBeenCalledTimes(1)
    })

    it('does not call resume when already running', async () => {
      const engine = await getEngine()
      await engine.resume()
      expect(mockCtxInstance.resume).not.toHaveBeenCalled()
    })
  })

  describe('getAnalyserNode', () => {
    it('creates analyser with correct fftSize', async () => {
      const engine = await getEngine()
      const analyser = engine.getAnalyserNode()

      expect(mockCtxInstance.createAnalyser).toHaveBeenCalledTimes(1)
      expect(analyser.fftSize).toBe(2048)
      expect(analyser.smoothingTimeConstant).toBe(0.8)
    })

    it('connects analyser to destination', async () => {
      const engine = await getEngine()
      engine.getAnalyserNode()

      const analyser = mockCtxInstance.createAnalyser.mock.results[0].value
      expect(analyser.connect).toHaveBeenCalledWith(mockCtxInstance.destination)
    })

    it('returns same analyser on subsequent calls', async () => {
      const engine = await getEngine()
      const a1 = engine.getAnalyserNode()
      const a2 = engine.getAnalyserNode()
      expect(a1).toBe(a2)
      expect(mockCtxInstance.createAnalyser).toHaveBeenCalledTimes(1)
    })
  })

  describe('playSynth', () => {
    it('creates an oscillator for standard types', async () => {
      const engine = await getEngine()
      engine.playSynth(TEST_PARAMS, 1)

      expect(mockCtxInstance.createOscillator).toHaveBeenCalled()
      const osc = mockCtxInstance.createOscillator.mock.results[0].value
      expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(440, 0)
      expect(osc.detune.setValueAtTime).toHaveBeenCalledWith(0, 0)
    })

    it('creates a BufferSource for white-noise type', async () => {
      const engine = await getEngine()
      engine.playSynth(NOISE_PARAMS, 1)

      expect(mockCtxInstance.createBufferSource).toHaveBeenCalled()
      const src = mockCtxInstance.createBufferSource.mock.results[0].value
      expect(src.loop).toBe(true)
    })

    it('schedules ADSR envelope correctly', async () => {
      const engine = await getEngine()
      engine.playSynth(TEST_PARAMS, 1)

      // First createGain call is for the envelope
      const gainCalls = mockCtxInstance.createGain.mock.results
      const envelopeGain = gainCalls[0].value

      // Start at 0
      expect(envelopeGain.gain.setValueAtTime).toHaveBeenCalledWith(0, 0)

      const rampCalls = envelopeGain.gain.linearRampToValueAtTime.mock.calls

      // Attack: ramp to 1 at time 0.1s (100ms)
      expect(rampCalls[0][0]).toBe(1)
      expect(rampCalls[0][1]).toBeCloseTo(0.1, 5)

      // Decay: ramp to sustain (0.7) at time 0.3s (100ms + 200ms)
      expect(rampCalls[1][0]).toBe(0.7)
      expect(rampCalls[1][1]).toBeCloseTo(0.3, 5)

      // Release: ramp to 0 at end of duration (1s)
      expect(rampCalls[2][0]).toBe(0)
      expect(rampCalls[2][1]).toBeCloseTo(1, 5)
    })

    it('creates BiquadFilter with correct params', async () => {
      const engine = await getEngine()
      engine.playSynth(TEST_PARAMS, 1)

      expect(mockCtxInstance.createBiquadFilter).toHaveBeenCalled()
      const filter = mockCtxInstance.createBiquadFilter.mock.results[0].value
      expect(filter.frequency.setValueAtTime).toHaveBeenCalledWith(2000, 0)
      expect(filter.Q.setValueAtTime).toHaveBeenCalledWith(1, 0)
    })

    it('sets master gain', async () => {
      const engine = await getEngine()
      engine.playSynth(TEST_PARAMS, 1)

      const gainCalls = mockCtxInstance.createGain.mock.results
      // Second gain node is master
      const masterGain = gainCalls[1].value
      expect(masterGain.gain.setValueAtTime).toHaveBeenCalledWith(0.8, 0)
    })

    it('starts and schedules stop on the source', async () => {
      const engine = await getEngine()
      engine.playSynth(TEST_PARAMS, 1)

      const osc = mockCtxInstance.createOscillator.mock.results[0].value
      expect(osc.start).toHaveBeenCalledWith(0)
      expect(osc.stop).toHaveBeenCalledWith(1)
    })

    it('uses calculated duration when not provided', async () => {
      const engine = await getEngine()
      // attack=100 + decay=200 + sustain_hold=500 + release=300 = 1100ms = 1.1s
      engine.playSynth(TEST_PARAMS)

      const osc = mockCtxInstance.createOscillator.mock.results[0].value
      expect(osc.start).toHaveBeenCalledWith(0)
      expect(osc.stop).toHaveBeenCalledWith(1.1)
    })
  })

  describe('stopSynth', () => {
    it('stops and disconnects the current source', async () => {
      const engine = await getEngine()
      engine.playSynth(TEST_PARAMS, 1)

      const osc = mockCtxInstance.createOscillator.mock.results[0].value
      engine.stopSynth()

      expect(osc.stop).toHaveBeenCalled()
      expect(osc.disconnect).toHaveBeenCalled()
    })

    it('does nothing when no source is playing', async () => {
      const engine = await getEngine()
      // Should not throw
      expect(() => engine.stopSynth()).not.toThrow()
    })
  })

  describe('renderToBuffer', () => {
    it('creates an OfflineAudioContext with correct params', async () => {
      const engine = await getEngine()
      // Initialize context to get sampleRate
      engine.getContext()

      await engine.renderToBuffer(TEST_PARAMS, 2)

      expect(mockOfflineCtxInstance.startRendering).toHaveBeenCalled()
    })

    it('returns an AudioBuffer', async () => {
      const engine = await getEngine()
      engine.getContext()

      const result = await engine.renderToBuffer(TEST_PARAMS, 1)

      expect(result).toBeDefined()
      expect(result.sampleRate).toBe(44100)
      expect(mockOfflineCtxInstance.startRendering).toHaveBeenCalled()
    })

    it('builds the synth chain on the offline context', async () => {
      const engine = await getEngine()
      engine.getContext()

      await engine.renderToBuffer(TEST_PARAMS, 1)

      expect(mockOfflineCtxInstance.createOscillator).toHaveBeenCalled()
      expect(mockOfflineCtxInstance.createGain).toHaveBeenCalled()
      expect(mockOfflineCtxInstance.createBiquadFilter).toHaveBeenCalled()
    })

    it('uses BufferSource for white-noise in offline context', async () => {
      const engine = await getEngine()
      engine.getContext()

      await engine.renderToBuffer(NOISE_PARAMS, 1)

      expect(mockOfflineCtxInstance.createBufferSource).toHaveBeenCalled()
    })
  })

  describe('dispose', () => {
    it('closes the audio context', async () => {
      const engine = await getEngine()
      engine.getContext()
      engine.dispose()

      expect(mockCtxInstance.close).toHaveBeenCalled()
    })

    it('disconnects the analyser', async () => {
      const engine = await getEngine()
      engine.getAnalyserNode()
      engine.dispose()

      const analyser = mockCtxInstance.createAnalyser.mock.results[0].value
      expect(analyser.disconnect).toHaveBeenCalled()
    })

    it('stops current source on dispose', async () => {
      const engine = await getEngine()
      engine.playSynth(TEST_PARAMS, 5)
      engine.dispose()

      const osc = mockCtxInstance.createOscillator.mock.results[0].value
      expect(osc.stop).toHaveBeenCalled()
    })
  })

  describe('_reset (test helper)', () => {
    it('allows re-initialization after reset', async () => {
      const engine = await getEngine()
      const ctx1 = engine.getContext()
      engine._reset()

      const ctx2 = engine.getContext()
      expect(ctx1).not.toBe(ctx2)
    })
  })
})
