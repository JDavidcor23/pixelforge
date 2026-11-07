import { ASSET_DEEP_LINK_PARAM } from '@/constants/routes'

/** The asset id carried by `?asset=<id>`, or `null` when the param is absent or empty. */
export function readAssetDeepLinkId(params: URLSearchParams): string | null {
  return params.get(ASSET_DEEP_LINK_PARAM) || null
}

/** A copy of `params` without the deep-link param; other params are kept. */
export function withoutAssetDeepLink(params: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(params)
  next.delete(ASSET_DEEP_LINK_PARAM)
  return next
}

interface SpriteDeepLinkDeps {
  readonly waitForCommands: () => Promise<void>
  readonly openAsset: (id: string) => Promise<boolean>
}

/** Waits until the persistence controller is registered, then opens `id`. Resolves `false` for an unknown id. */
export async function openSpriteDeepLink(id: string, deps: SpriteDeepLinkDeps): Promise<boolean> {
  await deps.waitForCommands()
  return deps.openAsset(id)
}

interface SoundDeepLinkDeps {
  readonly knownIds: readonly string[]
  readonly openSound: (id: string) => void
}

/** Opens `id` when the sound library holds it; otherwise does nothing and resolves `false`. */
export function openSoundDeepLink(id: string, deps: SoundDeepLinkDeps): boolean {
  if (!deps.knownIds.includes(id)) return false
  deps.openSound(id)
  return true
}
