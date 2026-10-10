import { describe, it, expect } from 'vitest'
import { encodeWav, createAudioObjectUrl } from '@/lib/audio-encoder'

// ── Mock AudioBuffer ─────────────────────────────────────────────────────────

class MockAudioBuffer {
  readonly sampleRate: number
  readonly numberOfChannels: number
  readonly length: number
  readonly duration: number
  private channels: Float32Array[]

  constructor(options: {
    numberOfChannels: number
    length: number
    sampleRate: number
    channelData?: Float32Array[]
  }) {
    this.numberOfChannels = options.numberOfChannels
    this.length = options.length
    this.sampleRate = options.sampleRate
    this.duration = options.length / options.sampleRate

    if (options.channelData) {
      this.channels = options.channelData
    } else {
      this.channels = Array.from(
        { length: options.numberOfChannels },
        () => new Float32Array(options.length)
      )
    }
  }

  getChannelData(channel: number): Float32Array {
    if (channel >= this.numberOfChannels) {
      throw new RangeError(`Channel index ${channel} out of range`)
    }
    return this.channels[channel]
  }
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('encodeWav', () => {
  it('produces a valid RIFF WAV header for mono buffer', () => {
    const buffer = new MockAudioBuffer({
      numberOfChannels: 1,
      length: 100,
      sampleRate: 44100,
    }) as unknown as AudioBuffer

    const blob = encodeWav(buffer)
    expect(blob.type).toBe('audio/wav')

    return blob.arrayBuffer().then((ab) => {
      const view = new DataView(ab)

      // RIFF signature
      const riff = String.fromCharCode(
        view.getUint8(0),
        view.getUint8(1),
        view.getUint8(2),
        view.getUint8(3)
      )
      expect(riff).toBe('RIFF')

      // WAVE format
      const wave = String.fromCharCode(
        view.getUint8(8),
        view.getUint8(9),
        view.getUint8(10),
        view.getUint8(11)
      )
      expect(wave).toBe('WAVE')

      // fmt chunk
      const fmt = String.fromCharCode(
        view.getUint8(12),
        view.getUint8(13),
        view.getUint8(14),
        view.getUint8(15)
      )
      expect(fmt).toBe('fmt ')

      // PCM format
      expect(view.getUint16(20, true)).toBe(1)

      // Channels
      expect(view.getUint16(22, true)).toBe(1)

      // Sample rate
      expect(view.getUint32(24, true)).toBe(44100)

      // Bits per sample
      expect(view.getUint16(34, true)).toBe(16)

      // data chunk
      const data = String.fromCharCode(
        view.getUint8(36),
        view.getUint8(37),
        view.getUint8(38),
        view.getUint8(39)
      )
      expect(data).toBe('data')

      // Data size: 100 frames × 1 channel × 2 bytes
      expect(view.getUint32(40, true)).toBe(200)

      // ChunkSize = 36 + dataSize
      expect(view.getUint32(4, true)).toBe(36 + 200)
    })
  })

  it('produces correct header for stereo buffer', () => {
    const buffer = new MockAudioBuffer({
      numberOfChannels: 2,
      length: 50,
      sampleRate: 48000,
    }) as unknown as AudioBuffer

    const blob = encodeWav(buffer)

    return blob.arrayBuffer().then((ab) => {
      const view = new DataView(ab)

      // Channels = 2
      expect(view.getUint16(22, true)).toBe(2)

      // Sample rate
      expect(view.getUint32(24, true)).toBe(48000)

      // Byte rate: 48000 * 2 channels * 2 bytes
      expect(view.getUint32(28, true)).toBe(192000)

      // Block align: 2 channels * 2 bytes
      expect(view.getUint16(32, true)).toBe(4)

      // Data size: 50 frames × 2 channels × 2 bytes
      expect(view.getUint32(40, true)).toBe(200)
    })
  })

  it('correctly converts Float32 samples to Int16', () => {
    const channelData = new Float32Array([0, 1, -1, 0.5, -0.5])
    const buffer = new MockAudioBuffer({
      numberOfChannels: 1,
      length: 5,
      sampleRate: 44100,
      channelData: [channelData],
    }) as unknown as AudioBuffer

    const blob = encodeWav(buffer)

    return blob.arrayBuffer().then((ab) => {
      const view = new DataView(ab)
      const headerOffset = 44

      // 0.0 → 0
      expect(view.getInt16(headerOffset, true)).toBe(0)

      // 1.0 → 32767 (0x7FFF)
      expect(view.getInt16(headerOffset + 2, true)).toBe(32767)

      // -1.0 → -32768 (clamp)
      expect(view.getInt16(headerOffset + 4, true)).toBe(-32768)

      // 0.5 → ~16384
      const half = view.getInt16(headerOffset + 6, true)
      expect(half).toBeGreaterThan(16300)
      expect(half).toBeLessThan(16400)

      // -0.5 → ~-16384
      const negHalf = view.getInt16(headerOffset + 8, true)
      expect(negHalf).toBeLessThan(-16300)
      expect(negHalf).toBeGreaterThan(-16400)
    })
  })

  it('clamps values outside [-1, 1] range', () => {
    const channelData = new Float32Array([1.5, -1.5, 2.0, -3.0])
    const buffer = new MockAudioBuffer({
      numberOfChannels: 1,
      length: 4,
      sampleRate: 44100,
      channelData: [channelData],
    }) as unknown as AudioBuffer

    const blob = encodeWav(buffer)

    return blob.arrayBuffer().then((ab) => {
      const view = new DataView(ab)
      const headerOffset = 44

      // 1.5 clamped to 1.0 → 32767
      expect(view.getInt16(headerOffset, true)).toBe(32767)

      // -1.5 clamped to -1.0 → -32768
      expect(view.getInt16(headerOffset + 2, true)).toBe(-32768)

      // 2.0 clamped to 1.0 → 32767
      expect(view.getInt16(headerOffset + 4, true)).toBe(32767)

      // -3.0 clamped to -1.0 → -32768
      expect(view.getInt16(headerOffset + 6, true)).toBe(-32768)
    })
  })

  it('interleaves stereo channels correctly', () => {
    const left = new Float32Array([1, -1])
    const right = new Float32Array([0.5, -0.5])
    const buffer = new MockAudioBuffer({
      numberOfChannels: 2,
      length: 2,
      sampleRate: 44100,
      channelData: [left, right],
    }) as unknown as AudioBuffer

    const blob = encodeWav(buffer)

    return blob.arrayBuffer().then((ab) => {
      const view = new DataView(ab)
      const headerOffset = 44

      // Frame 0: left=1.0 → 32767, right=0.5 → ~16384
      expect(view.getInt16(headerOffset, true)).toBe(32767)
      const r0 = view.getInt16(headerOffset + 2, true)
      expect(r0).toBeGreaterThan(16300)
      expect(r0).toBeLessThan(16400)

      // Frame 1: left=-1.0 → -32768, right=-0.5 → ~-16384
      expect(view.getInt16(headerOffset + 4, true)).toBe(-32768)
      const r1 = view.getInt16(headerOffset + 6, true)
      expect(r1).toBeLessThan(-16300)
      expect(r1).toBeGreaterThan(-16400)
    })
  })
})

describe('createAudioObjectUrl', () => {
  it('returns a blob URL string', () => {
    const buffer = new MockAudioBuffer({
      numberOfChannels: 1,
      length: 10,
      sampleRate: 44100,
    }) as unknown as AudioBuffer

    const url = createAudioObjectUrl(buffer)
    expect(url).toMatch(/^blob:/)
  })
})
