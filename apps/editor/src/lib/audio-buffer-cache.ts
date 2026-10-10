import type { AudioAsset } from '@/types/audio'
import { audioEngine } from './audio-engine'
import { decodeAudioBlob } from './audio-encoder'

/**
 * Decoded AudioBuffers per asset id. AudioBuffers are not serializable, so
 * they live here instead of the Zustand store; the store keeps the URL.
 */
const buffers = new Map<string, AudioBuffer>()
const inflight = new Map<string, Promise<AudioBuffer | null>>()

async function decodeFromUrl(url: string): Promise<AudioBuffer> {
  const response = await fetch(url)
  const blob = await response.blob()
  return decodeAudioBlob(blob, audioEngine.getContext())
}

export const audioBufferCache = {
  get(assetId: string): AudioBuffer | null {
    return buffers.get(assetId) ?? null
  },

  set(assetId: string, buffer: AudioBuffer): void {
    buffers.set(assetId, buffer)
  },

  delete(assetId: string): void {
    buffers.delete(assetId)
    inflight.delete(assetId)
  },

  /** Returns the cached buffer, decoding the asset's audio on first use. */
  load(asset: AudioAsset): Promise<AudioBuffer | null> {
    const cached = buffers.get(asset.id)
    if (cached) return Promise.resolve(cached)

    const pending = inflight.get(asset.id)
    if (pending) return pending

    const url = asset.localObjectUrl ?? asset.supabaseUrl
    if (!url) return Promise.resolve(null)

    const request = decodeFromUrl(url)
      .then((buffer) => {
        buffers.set(asset.id, buffer)
        return buffer
      })
      .catch((error: unknown) => {
        console.error('Failed to decode audio asset:', error)
        return null
      })
      .finally(() => {
        inflight.delete(asset.id)
      })

    inflight.set(asset.id, request)
    return request
  },
}
