const WAV_HEADER_SIZE = 44
const BITS_PER_SAMPLE = 16
const BYTES_PER_SAMPLE = BITS_PER_SAMPLE / 8
const MAX_INT16 = 0x7fff

function floatToInt16(sample: number): number {
  const clamped = Math.max(-1, Math.min(1, sample))
  return clamped < 0
    ? Math.max(-MAX_INT16 - 1, Math.round(clamped * (MAX_INT16 + 1)))
    : Math.min(MAX_INT16, Math.round(clamped * MAX_INT16))
}

function writeWavHeader(
  view: DataView,
  numChannels: number,
  sampleRate: number,
  dataSize: number
): void {
  const byteRate = sampleRate * numChannels * BYTES_PER_SAMPLE
  const blockAlign = numChannels * BYTES_PER_SAMPLE

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true) // ChunkSize
  writeString(view, 8, 'WAVE')

  // fmt sub-chunk
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true) // Subchunk1Size (PCM = 16)
  view.setUint16(20, 1, true) // AudioFormat (PCM = 1)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, BITS_PER_SAMPLE, true)

  // data sub-chunk
  writeString(view, 36, 'data')
  view.setUint32(40, dataSize, true) // Subchunk2Size
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i))
  }
}

export function encodeWav(audioBuffer: AudioBuffer): Blob {
  const numChannels = audioBuffer.numberOfChannels
  const sampleRate = audioBuffer.sampleRate
  const numFrames = audioBuffer.length
  const dataSize = numFrames * numChannels * BYTES_PER_SAMPLE
  const bufferSize = WAV_HEADER_SIZE + dataSize

  const arrayBuffer = new ArrayBuffer(bufferSize)
  const view = new DataView(arrayBuffer)

  writeWavHeader(view, numChannels, sampleRate, dataSize)

  // Collect channel data
  const channels: Float32Array[] = []
  for (let ch = 0; ch < numChannels; ch++) {
    channels.push(audioBuffer.getChannelData(ch))
  }

  // Write interleaved PCM data
  let offset = WAV_HEADER_SIZE
  for (let frame = 0; frame < numFrames; frame++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = floatToInt16(channels[ch][frame])
      view.setInt16(offset, sample, true)
      offset += BYTES_PER_SAMPLE
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' })
}

export async function decodeAudioBlob(
  blob: Blob,
  context: AudioContext
): Promise<AudioBuffer> {
  const arrayBuffer = await blob.arrayBuffer()
  return context.decodeAudioData(arrayBuffer)
}

export function createAudioObjectUrl(audioBuffer: AudioBuffer): string {
  const blob = encodeWav(audioBuffer)
  return URL.createObjectURL(blob)
}
