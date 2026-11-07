import type { AudioAsset } from '@/types/audio'

/**
 * Merges sounds listed from the Supabase bucket into the session library.
 *
 * Dedupe rule: a listed sound is dropped when a session sound has the same
 * `id` OR the same `supabaseUrl` (`listAudioAssets` uses the file uuid as id,
 * and the storage path is `<userId>/sounds/<uuid>.wav`). Session assets win:
 * they carry richer metadata (name, duration, source, peaks) than a listing.
 * New listed sounds are appended after the session ones (they are older).
 * Returns `existing` itself when nothing is new, so the store can skip a set.
 */
export function mergeListedSounds(
  existing: readonly AudioAsset[],
  listed: readonly AudioAsset[],
): AudioAsset[] {
  const seenIds = new Set<string>()
  const seenUrls = new Set<string>()
  for (const asset of existing) {
    seenIds.add(asset.id)
    if (asset.supabaseUrl) seenUrls.add(asset.supabaseUrl)
  }

  const fresh: AudioAsset[] = []
  for (const asset of listed) {
    if (seenIds.has(asset.id)) continue
    if (asset.supabaseUrl && seenUrls.has(asset.supabaseUrl)) continue
    seenIds.add(asset.id)
    if (asset.supabaseUrl) seenUrls.add(asset.supabaseUrl)
    fresh.push(asset)
  }

  return fresh.length === 0 ? (existing as AudioAsset[]) : [...existing, ...fresh]
}
