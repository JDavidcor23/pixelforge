import type { SynthParameters, FilterType } from '@/types/audio'

const ANALYSER_FFT_SIZE = 2048
const ANALYSER_SMOOTHING = 0.8
const SUSTAIN_HOLD_MS = 500
const NOISE_BUFFER_DURATION = 2
const NOISE_SAMPLE_RATE = 44100

function msToSec(ms: number): number {
  return ms / 1000
}

function mapFilterType(type: FilterType): BiquadFilterType {
  const map: Record<FilterType, BiquadFilterType> = {
    lowpass: 'lowpass',
    highpass: 'highpass',
    bandpass: 'bandpass',
  }
  return map[type]
}

function calculateDefaultDuration(params: SynthParameters): number {
  const { attack, decay, release } = params.envelope
  return msToSec(attack + decay + SUSTAIN_HOLD_MS + release)
}

function createWhiteNoiseBuffer(context: BaseAudioContext): AudioBuffer {
  const bufferSize = context.sampleRate * NOISE_BUFFER_DURATION
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1
  }
  return buffer
}

function buildSynthChain(
  context: BaseAudioContext,
  params: SynthParameters,
  duration: number,
  startTime: number
): { source: AudioScheduledSourceNode; lastNode: AudioNode } {
  const { oscillator: oscParams, envelope, filter: filterParams, masterGain } = params

  // Create source node
  let source: AudioScheduledSourceNode
  if (oscParams.type === 'white-noise') {
    const noiseSource = context.createBufferSource()
    noiseSource.buffer = createWhiteNoiseBuffer(context)
    noiseSource.loop = true
    source = noiseSource
  } else {
    const osc = context.createOscillator()
    osc.type = oscParams.type
    osc.frequency.setValueAtTime(oscParams.frequency, startTime)
    osc.detune.setValueAtTime(oscParams.detune, startTime)
    source = osc
  }

  // ADSR envelope via GainNode
  const envelopeGain = context.createGain()
  const attackSec = msToSec(envelope.attack)
  const decaySec = msToSec(envelope.decay)
  const releaseSec = msToSec(envelope.release)

  envelopeGain.gain.setValueAtTime(0, startTime)
  envelopeGain.gain.linearRampToValueAtTime(1, startTime + attackSec)
  envelopeGain.gain.linearRampToValueAtTime(
    envelope.sustain,
    startTime + attackSec + decaySec
  )

  const releaseStart = startTime + duration - releaseSec
  envelopeGain.gain.setValueAtTime(envelope.sustain, releaseStart)
  envelopeGain.gain.linearRampToValueAtTime(0, startTime + duration)

  // BiquadFilter
  const biquadFilter = context.createBiquadFilter()
  biquadFilter.type = mapFilterType(filterParams.type)
  biquadFilter.frequency.setValueAtTime(filterParams.frequency, startTime)
  biquadFilter.Q.setValueAtTime(filterParams.q, startTime)

  // Master gain
  const masterGainNode = context.createGain()
  masterGainNode.gain.setValueAtTime(masterGain, startTime)

  // Chain: Source → Envelope Gain → BiquadFilter → Master Gain
  source.connect(envelopeGain)
  envelopeGain.connect(biquadFilter)
  biquadFilter.connect(masterGainNode)

  return { source, lastNode: masterGainNode }
}

export class AudioEngine {
  private context: AudioContext | null = null
  private analyserNode: AnalyserNode | null = null
  private currentSource: AudioScheduledSourceNode | null = null
  private gainNode: GainNode | null = null

  getContext(): AudioContext {
    if (!this.context) {
      this.context = new AudioContext()
    }
    return this.context
  }

  async resume(): Promise<void> {
    const ctx = this.getContext()
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }
  }

  isSuspended(): boolean {
    if (!this.context) return false
    return this.context.state === 'suspended'
  }

  getAnalyserNode(): AnalyserNode {
    if (!this.analyserNode) {
      const ctx = this.getContext()
      this.analyserNode = ctx.createAnalyser()
      this.analyserNode.fftSize = ANALYSER_FFT_SIZE
      this.analyserNode.smoothingTimeConstant = ANALYSER_SMOOTHING
      this.analyserNode.connect(ctx.destination)
    }
    return this.analyserNode
  }

  playSynth(params: SynthParameters, duration?: number): void {
    this.stopSynth()

    const ctx = this.getContext()
    const actualDuration = duration ?? calculateDefaultDuration(params)
    const startTime = ctx.currentTime

    const { source, lastNode } = buildSynthChain(ctx, params, actualDuration, startTime)
    const analyser = this.getAnalyserNode()

    lastNode.connect(analyser)

    this.currentSource = source
    source.start(startTime)
    source.stop(startTime + actualDuration)

    source.onended = () => {
      source.disconnect()
      lastNode.disconnect()
      if (this.currentSource === source) {
        this.currentSource = null
      }
    }
  }

  stopSynth(): void {
    if (this.currentSource) {
      try {
        this.currentSource.stop()
        this.currentSource.disconnect()
      } catch {
        // Source may have already stopped
      }
      this.currentSource = null
    }
  }

  async renderToBuffer(params: SynthParameters, duration: number): Promise<AudioBuffer> {
    const sampleRate = this.context?.sampleRate ?? NOISE_SAMPLE_RATE
    const length = Math.ceil(sampleRate * duration)
    const offlineContext = new OfflineAudioContext(1, length, sampleRate)

    const startTime = 0
    const { source, lastNode } = buildSynthChain(offlineContext, params, duration, startTime)

    lastNode.connect(offlineContext.destination)
    source.start(startTime)
    source.stop(startTime + duration)

    return offlineContext.startRendering()
  }

  dispose(): void {
    this.stopSynth()
    if (this.analyserNode) {
      this.analyserNode.disconnect()
      this.analyserNode = null
    }
    if (this.context) {
      void this.context.close()
      this.context = null
    }
  }

  /** Reset internal state for testing purposes */
  _reset(): void {
    this.dispose()
  }
}

export const audioEngine = new AudioEngine()
