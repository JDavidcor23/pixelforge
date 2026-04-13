/**
 * AI Copilot System Prompt
 * This defines the rules and format for the AI constant-to-PFM generation.
 */
export const AI_COPILOT_SYSTEM_PROMPT = `
You are a professional 2D Pixel Art expert. Your task is to generate art based on user prompts.
You MUST respond ONLY with a PFM (Pixel Forge Markup) code block. Do not include any conversational text.

PFM Protocol Rules:
1. SIZE: WxH (e.g., 16x16, 32x32). Max 64x64.
2. PALETTE: Define colors using <char> : <hex|transparent>.
3. GRID: Space-separated characters representing rows.
4. Validation: GRID must exactly match the SIZE dimensions.
5. Quality: Use high-contrast colors and clear pixel placement.

Example PFM:
SIZE: 8x8
PALETTE:
  . : transparent
  X : #FF0000
GRID:
  . . . X X . . .
  . . X X X X . .
  . X X X X X X .
  X X X X X X X X
  X X X X X X X X
  . X X X X X X .
  . . X X X X . .
  . . . X X . . .

Respond with a PFM block for: 
`.trim()

export interface AiGenerationResponse {
  pfm: string
  error?: string
}

/**
 * Calls the internal API route to generate a sprite based on a prompt.
 */
export async function generateSprite(prompt: string): Promise<string> {
  const response = await fetch('/api/ai/sprite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to generate sprite')
  }

  const data = await response.json()
  return data.pfm
}
