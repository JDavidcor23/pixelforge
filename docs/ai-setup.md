# AI Setup & Usage

PixelForge integrates AI services to accelerate your game development workflow. This guide explains how to configure and use them.

## 🔑 API Configuration

PixelForge prioritizes your privacy. **All API keys are stored exclusively in your browser's `localStorage`.** They are never sent to our servers.

Open the editor and click the gear icon ⚙️ to open the **Settings** panel. Two keys can be configured there:

### Retro Diffusion (sprites & animation)

Retro Diffusion is the engine for all pixel art generation — single sprites and animation sheets.

1. Get an API key from [Retro Diffusion](https://www.retrodiffusion.ai/).
2. Paste it into the **Retro Diffusion** field in the Settings panel.
3. Save. The key is kept in `localStorage` only.

### ElevenLabs (audio)

ElevenLabs powers AI sound effect generation in the audio module.

1. Get an API key from [ElevenLabs](https://elevenlabs.io/).
2. Paste it into the **ElevenLabs** field in the Settings panel.

## 🤖 Generating Sprites

1. Open the **AI** section in the right sidebar of the sprite editor.
2. Enter a descriptive prompt (e.g., *"A legendary fire sword, 16-bit style"*).
3. Pick the generation size.
4. Click **Generate**. The estimated cost is shown before you spend anything — cost checks are free.
5. Once generated, you can:
   - **Click the image**: apply it directly to the canvas.
   - **Download PNG**: save the result to your device.
   - **Download JSON**: save the raw pixel data.

Generations are cached in `localStorage`, so re-applying a previous result costs nothing.

### Generating Animations

1. Draw or generate the sprite you want to animate — it becomes the **reference frame**.
2. Choose an action (idle, walk, run, attack, jump) and a direction.
3. Choose the frame count. Animations are billed **flat**, regardless of frame count, so asking for more frames costs the same.
4. The response arrives as one grid sheet and is sliced into individual timeline frames automatically.

### Tips for Better Prompts

- **Be specific**: include colors, styles (e.g., "GameBoy", "NES", "Modern"), and perspective ("Top-down", "Side-scrolling").
- **Reference fidelity**: for animations, the reference frame drives the palette and proportions — a clean reference gives cleaner frames.

## 🛡️ Security Note

If you clear your browser's site data or cache, you will need to re-enter your API keys. We recommend keeping a backup of your keys in a secure password manager.
