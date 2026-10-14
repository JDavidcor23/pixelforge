> AI-generated source notes. Reference material, not the owner's writing.

# AI sprite variations

Back to the [index](./README.md).

## What

Let the user ask for several takes of one prompt (for example 1–4) in the
Create tab and pick the best one.

## Why it waited

Removed from the Create tab redesign on 2026-10-13 to keep the panel simple.
The Pencil frame "Sprite Studio v3 · Create (AI-first)" in `design.pen` has no
variations control.

## What it affects

- **Create tab UI:** a "Variations" select next to Size.
- **AI proxy:** `apps/editor/api/ai/retro-diffusion.ts` sends `num_images: 1`
  today.
- **Cost estimate:** the "Est. $…" line must multiply by the number of images.
- **Assets panel:** every result gets saved there, not inside the Create tab.

## API support (verified 2026-10-13)

Retro Diffusion's `num_images` returns several varied images for the same
prompt in one call. Limits depend on the style: up to 16 for most styles,
4 for some RD Pro styles, 1 for a few specialized styles. Each image is billed
separately.

Sources: <https://github.com/Retro-Diffusion/api-examples>,
<https://glama.ai/mcp/connectors/ai.retrodiffusion.mcp/retro-diffusion-pixel-art-mcp/tools/create_inference>

## How to build it

1. Default to 1 so nobody spends ×4 by accident.
2. Clamp the select to the chosen style's maximum.
3. Show the multiplied cost before the user clicks "Create with AI".
4. Save every generated image to Assets and let the user open one on the canvas.
