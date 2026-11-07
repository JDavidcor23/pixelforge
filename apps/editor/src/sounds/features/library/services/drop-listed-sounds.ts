import type { AudioAsset } from '@/types/audio'

/** Removes sounds that came from a bucket listing; session-created sounds stay. Same reference when none. */
export function dropListedSounds(assets: readonly AudioAsset[]): AudioAsset[] {
  return assets.some((a) => a.fromBucketListing)
    ? assets.filter((a) => !a.fromBucketListing)
    : (assets as AudioAsset[])
}
