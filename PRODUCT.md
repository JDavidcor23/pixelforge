# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Indie and hobbyist creators building 2D games in the browser. They are not
artists or audio engineers: they need sprites and sound effects (jump, coin,
explosion, music loops) to ship a game, and have never used a pixel editor,
a synthesizer or a DAW. The sound editor in particular must work for someone
who has never opened an audio tool.

## Product Purpose

PixelForge lets a creator make game assets (sprites manually or with AI, sounds
with a synthesizer or with AI), build scenes visually and publish to Vercel in
one click. Success is a creator getting a usable asset into their game without
learning the underlying craft first.

## Positioning

One browser tool covering the whole asset-to-published-game loop, with AI
generation as a first-class path next to manual creation, not a separate app.

## Operating Context

- Two apps: `apps/landing` (marketing) and `apps/editor` (sprite + sound editor SPA).
- API keys for AI providers (Retro Diffusion, ElevenLabs) are entered once in
  the editor's Settings panel. Feature panels must not ask for keys again.
- Sounds are produced for use inside a game: short SFX, music, dialog.

## Capabilities and Constraints

- Sound editor today: synth presets (Laser, Explosion, Jump, Coin, Power Up),
  oscillator (sine, square, sawtooth, triangle, noise; frequency, detune),
  ADSR envelope, filter (type, cutoff, resonance), master gain, WAV export;
  AI generation via ElevenLabs in three modes (SFX, Music, TTS); generation
  history; library with search, category filter (SFX, Music, Dialog) and sort;
  transport (play, stop, loop, seek, volume).
- Technical audio parameters may stay available, but must never be the entry
  point for a non-expert user.
- Browser requires a user gesture before audio can start.

## Brand Commitments

Name: PixelForge. Visual language is documented in `DESIGN.md`.

## Product Principles

1. Start from intent ("what sound do you need?"), not from parameters.
2. Every control explains itself in plain words and gives immediate audible feedback.
3. AI and manual creation are two equal paths to the same result.
4. Configuration lives in one place (Settings); feature panels only create.
5. Advanced depth is available, never required.
