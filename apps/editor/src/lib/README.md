# Sprite Generation with Retro Diffusion

The editor generates sprites and animations from text prompts using the
[Retro Diffusion](https://www.retrodiffusion.ai/) API. It is the only image
generation engine in the project.

## Sprite Flow

1. **Prompt**: the user writes a description (e.g. "A cute slime").
2. **API call**: `generateSpriteWithRetroDiffusion` hits the
   `/api/ai/retro-diffusion` route handler, which forwards the request with the
   user's API key in the `X-RD-Token` header.
3. **Response**: Retro Diffusion returns a **true RGBA** PNG in Base64, at the
   exact width and height that were requested.
4. **Decoding**: `decodeGeneratedSprite` turns that Base64 into the editor's
   pixel buffer.
5. **Apply**: the store (`overwriteWithPixels`) replaces the current canvas and
   adjusts its dimensions.

## Animation Flow

1. The current frame is exported as the reference image (`input_image`).
2. `generateAnimationWithRetroDiffusion` requests the animation with
   `return_spritesheet: true` — a GIF cannot be decomposed on a canvas.
3. The response is **one grid sheet** (4 frames of 64px arrive as a single
   128x128 PNG, 2x2), with exact cells and no gutters.
4. `sliceAnimationSheet` cuts the frames by division: rows and columns come from
   dividing the sheet's real dimensions by the requested frame size.

## Key Utilities (`retro-diffusion-utils.ts`)

- `generateSpriteWithRetroDiffusion`: generates a single sprite.
- `estimateRetroDiffusionCost`: queries the price via `check_cost` (free) before
  spending anything.
- `decodeGeneratedSprite`: Base64 to pixels. If the PNG already matches the grid
  size it is used **verbatim**; otherwise it falls through to the import pipeline.
- `generateAnimationWithRetroDiffusion`: generates the animation sheet.
- `sliceAnimationSheet`: cuts the sheet into individual frames.

## Why There Is No Background Removal

Retro Diffusion returns a real alpha channel (`remove_bg: true`), so the editor
never has to guess a background colour to key out. There is no chroma key, no
halo erosion and no tolerance constants. Do not add them back: the pipeline in
`sprite-pipeline.ts` exists only for images the user imports from outside, and
those are imported faithfully.

## History

Generations are cached in the browser's `localStorage`, so a previous sprite can
be re-applied without paying for generation again.

## Requirements

- **API key**: the user configures their Retro Diffusion key in the settings
  panel (⚙️). It lives in `localStorage` only, never on the backend.
