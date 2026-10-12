/**
 * In-memory-only cache of raw Retro Diffusion animation sheets, keyed by
 * `AIAnimation.id`. Never persisted — a multi-frame sheet's base64 can run
 * several MB and would blow the quota shared with the generation and
 * animation histories (see `useAnimationGenerator`'s original comment, now
 * split across the Create/Animate tabs and the Assets tab, all of which need
 * the same cache). Lost on reload, same as before the Sprite Studio v2
 * redesign.
 */
const sheetsById = new Map<string, string>()

export const animationSheetCache = {
  get: (animationId: string): string | undefined => sheetsById.get(animationId),
  set: (animationId: string, sheetBase64: string): void => {
    sheetsById.set(animationId, sheetBase64)
  },
  has: (animationId: string): boolean => sheetsById.has(animationId),
}
