import type { AudioAsset } from '@/types/audio'
import type { TimelineClip } from '@/types/timeline'
import { audioBufferCache } from './audio-buffer-cache'

/**
 * Decodes (or reuses) the source buffer of every asset the clips use.
 * `missing` lists asset ids that could not be loaded.
 */
export async function loadClipBuffers(
  clips: readonly TimelineClip[],
  assets: readonly AudioAsset[]
): Promise<{ buffers: Map<string, AudioBuffer>; missing: string[] }> {
  const assetIds = [...new Set(clips.map((clip) => clip.assetId))]
  const loaded = await Promise.all(
    assetIds.map(async (assetId) => {
      const asset = assets.find((item) => item.id === assetId)
      return [assetId, asset ? await audioBufferCache.load(asset) : null] as const
    })
  )

  const buffers = new Map<string, AudioBuffer>()
  const missing: string[] = []
  for (const [assetId, buffer] of loaded) {
    if (buffer) buffers.set(assetId, buffer)
    else missing.push(assetId)
  }
  return { buffers, missing }
}
