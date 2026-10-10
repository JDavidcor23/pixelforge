/**
 * Amplitude-peak helpers for waveform drawing. Peaks are normalized 0..1
 * against the loudest bucket so quiet sounds still read as a shape.
 */

/** Reduces an AudioBuffer to `count` normalized absolute-peak buckets. */
export function computePeaks(buffer: AudioBuffer, count: number): number[] {
  const length = buffer.length
  if (length === 0 || count <= 0) return new Array<number>(Math.max(count, 0)).fill(0)

  const channels: Float32Array[] = []
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    channels.push(buffer.getChannelData(ch))
  }

  const bucketSize = length / count
  const peaks: number[] = []
  for (let i = 0; i < count; i++) {
    const start = Math.floor(i * bucketSize)
    const end = Math.max(start + 1, Math.floor((i + 1) * bucketSize))
    let peak = 0
    for (const data of channels) {
      for (let s = start; s < end && s < length; s++) {
        const value = Math.abs(data[s])
        if (value > peak) peak = value
      }
    }
    peaks.push(peak)
  }

  return normalizePeaks(peaks)
}

function normalizePeaks(peaks: readonly number[]): number[] {
  const max = peaks.reduce((acc, value) => Math.max(acc, value), 0)
  if (max === 0) return peaks.map(() => 0)
  return peaks.map((value) => value / max)
}

/** Resamples a peak array to `count` buckets, keeping each bucket's max. */
export function resamplePeaks(peaks: readonly number[], count: number): number[] {
  if (count <= 0) return []
  if (peaks.length === 0) return new Array<number>(count).fill(0)

  const bucketSize = peaks.length / count
  const result: number[] = []
  for (let i = 0; i < count; i++) {
    const start = Math.floor(i * bucketSize)
    const end = Math.max(start + 1, Math.floor((i + 1) * bucketSize))
    let peak = 0
    for (let p = start; p < end && p < peaks.length; p++) {
      if (peaks[p] > peak) peak = peaks[p]
    }
    result.push(peak)
  }
  return result
}
