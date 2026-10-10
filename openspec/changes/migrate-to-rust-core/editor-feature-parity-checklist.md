# Editor feature-parity checklist (phase 3, task 3.13)

**Status: prepared, NOT executed.** This agent has no browser/screenshot tool
available (no Playwright/Computer Use in this run), so the checklist below
was NOT clicked through in a real browser. What WAS verified automatically:
`tsc --noEmit` (0 errors), the full Vitest suite (252/252 passing, unchanged
behavior from before the move), and that every route/module in the chain
`main.tsx → App.tsx → EditorLayout → SpriteEditorLayout/SoundEditorLayout`
transforms and serves via the Vite dev server with no 500s. A human (or an
agent with a browser tool) should run `pnpm --filter @pixelforge/editor dev`,
open `http://localhost:5173`, and walk this list before this task is checked
off in `tasks.md`.

## Sprite editor (`/sprites`)

- [ ] New layer, toggle visibility, toggle lock, rename, reorder, delete
- [ ] Pencil draw, eraser, bucket fill — pixels land correctly, respect locked layers
- [ ] Undo / redo across a draw, a fill, a layer add/remove, a frame add/remove
- [ ] Color picker (area + hex/RGB inputs), palette save/select, eyedropper
- [ ] Add/remove/select animation frames, onion skinning, playback (fps/loop)
- [ ] Copy/paste frames, cut/paste selection (marquee transform + commit)
- [ ] Zoom/pan (infinite canvas), grid overlay toggle
- [ ] Export (PNG / spritesheet / JSON)
- [ ] AI sprite generation (Retro Diffusion) — prompt → image appears on canvas
- [ ] AI animation generation — spritesheet slices into the correct frame count
- [ ] Reload the page mid-session — IndexedDB draft restores (no data loss)

## Sound editor (`/sounds`)

- [ ] Synthesizer panel (oscillator/filter/envelope controls) produces sound
- [ ] Preset selector loads a preset
- [ ] AI sound generation (ElevenLabs sfx/music/tts) — BYOK key accepted, audio returned
- [ ] Asset library: import, play, delete a sound asset
- [ ] Transport bar play/pause/stop, waveform display renders

## Shell

- [ ] Nav between Sprites/Sounds preserves state (no remount data loss)
- [ ] Settings panel opens/closes, saves API keys (Retro Diffusion / ElevenLabs)
- [ ] No console errors on any of the above (`console.error` only in real catch paths)

## Not covered by this list (needs a deploy, tracked separately)

- Vercel Functions actually reachable at `/api/ai/*` in a deployed environment
  (unit-level request/response behavior IS covered by
  `apps/editor/api/ai/{retro-diffusion,elevenlabs}.test.ts`, 10/10 passing —
  this checklist item is about the deployed routing/rewrite, not the handler logic)
- Production bundle inspection for leaked keys (task 3.14 — needs a real build)
