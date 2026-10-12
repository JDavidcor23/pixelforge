import type { AssetType, GameTemplate } from '@/types'

/**
 * Joins the user's prompt with the active game template's rules for this asset
 * type. No template, or no rules for this asset type, returns the prompt as-is.
 */
export function buildPrompt(userPrompt: string, template: GameTemplate | null, assetType: AssetType): string {
  const trimmed = userPrompt.trim()
  const rules = template?.rules[assetType]
  return rules ? `${trimmed}, ${rules}` : trimmed
}
