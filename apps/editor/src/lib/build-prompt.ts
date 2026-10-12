import { ASSET_TYPES } from '@/constants'
import type { AssetType, GameTemplate } from '@/types'

/**
 * Joins the active game template's rules for this asset type with the user's
 * prompt. Rules come FIRST: live testing (2026-10-11) showed Retro Diffusion
 * weighs the tail of a long prompt less — rules trailing the user's text got
 * diluted by long descriptions, cropping the character. The user's text is
 * labeled with its asset type (e.g. "Character:", "Weapon:") rather than a
 * hardcoded "Character:" so this stays correct once a template defines rules
 * for a non-character asset type. No template, or no rules for this asset
 * type, returns the prompt as-is.
 */
export function buildPrompt(userPrompt: string, template: GameTemplate | null, assetType: AssetType): string {
  const trimmed = userPrompt.trim()
  const rules = template?.rules[assetType]
  if (!rules) return trimmed
  const assetTypeLabel = ASSET_TYPES.find((type) => type.id === assetType)?.label ?? assetType
  return `${rules} ${assetTypeLabel}: ${trimmed}`
}
