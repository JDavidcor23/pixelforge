import type { AnimationReference, AssetLibraryItem } from '@/types'

/**
 * Pure logic of the Animate tab's locked reference (ADR 0011). The hook and
 * the picker only call these builders, so every rule here is testable in
 * Node — same convention as `lib/animation-job-ledger.ts`.
 */

/** `Frame N` (1-based) — shown on the chip and in the picker for a canvas-frame pick. */
export const canvasFrameReferenceLabel = (frameIndex: number): string => `Frame ${frameIndex + 1}`

/** Locks a snapshot of one timeline frame, tagged with its index so the picker can re-highlight it later. */
export const buildCanvasReference = (frameIndex: number, imageBase64: string): AnimationReference => ({
  source: { kind: 'canvas', frameIndex },
  imageBase64,
  label: canvasFrameReferenceLabel(frameIndex),
})

/** Locks a snapshot of an existing Asset — its own thumbnail is already a full-resolution PNG. */
export const buildAssetReference = (item: AssetLibraryItem, imageBase64: string): AnimationReference => ({
  source: { kind: 'asset', assetId: item.id },
  imageBase64,
  label: item.label,
})

/**
 * What `handleGenerateAnimation` submits as `firstFrameBase64` (ADR 0011, S3):
 * the locked session reference, never a fresh export of the live canvas.
 */
export const resolveAnimationReferenceImage = (reference: AnimationReference | null): string | null =>
  reference?.imageBase64 ?? null
