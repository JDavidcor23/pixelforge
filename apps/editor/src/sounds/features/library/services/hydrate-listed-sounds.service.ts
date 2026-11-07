import type { AudioAsset } from '@/types/audio'

interface HydrateListedSoundsDeps {
  readonly userId: string
  readonly listAssets: (userId: string) => Promise<AudioAsset[]>
  readonly applyListed: (listed: AudioAsset[]) => void
  /** `false` once the user changed while the listing was in flight: the result is discarded. */
  readonly isCurrent: () => boolean
}

/**
 * Lists the signed-in user's bucket, marks each sound `fromBucketListing`, and
 * hands them to `applyListed`. A failure or a stale user leaves the store untouched.
 */
export async function hydrateListedSounds({
  userId,
  listAssets,
  applyListed,
  isCurrent,
}: HydrateListedSoundsDeps): Promise<void> {
  try {
    const listed = await listAssets(userId)
    if (!isCurrent() || listed.length === 0) return
    applyListed(listed.map((asset) => ({ ...asset, fromBucketListing: true })))
  } catch (e) {
    console.error('Could not load your saved sounds — the library keeps this session only.', e)
  }
}
