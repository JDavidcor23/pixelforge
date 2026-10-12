# Sprite Generation with Retro Diffusion

The editor generates sprites from text prompts using the
[Retro Diffusion](https://www.retrodiffusion.ai/) API. Animations use PixelLab
(see "Animation Flow" below).

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

## Animation Flow (PixelLab, ADR 0009)

Animations no longer use Retro Diffusion. The Animate tab depends on the
`AnimationProvider` port (`services/animation-provider.service.ts`); PixelLab
is the only adapter (`services/pixellab-animation.service.ts`).

1. The current canvas is exported at its own size as the first frame.
2. `buildAnimationAction` (`animation-harness.ts`) puts the asset type's
   identity rules FIRST, then the motion text from `ANIMATION_HARNESS`.
3. `api/ai/pixellab/animate` submits the job and returns its id at once;
   `api/ai/pixellab/job` reads the status (`pixellab-job.ts` drops the input
   frame at index 0 and returns PNG data URIs).
4. The hook polls every 3 s (5 min timeout). The pending job id survives a
   reload (sessionStorage) so a paid job is never lost.

`scripts/pixellab-animate-harness.ts` evaluates the same catalogue offline.

## Key Utilities (`retro-diffusion-utils.ts`)

- `generateSpriteWithRetroDiffusion`: generates a single sprite.
- `estimateRetroDiffusionCost`: queries the price via `check_cost` (free) before
  spending anything.
- `decodeGeneratedSprite`: Base64 to pixels. If the PNG already matches the grid
  size it is used **verbatim**; otherwise it falls through to the import pipeline.

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
