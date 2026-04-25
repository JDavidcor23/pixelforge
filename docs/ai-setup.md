# AI Copilot Setup & Usage

PixelForge integrates advanced AI models to accelerate your game development workflow. This guide explains how to configure and use these features.

## 🔑 API Configuration

PixelForge prioritizes your privacy. **All API keys are stored exclusively in your browser's `localStorage`.** They are never sent to our servers.

### PixelLab API
PixelLab is our primary engine for high-quality pixel art generation.
1. Get an API key from [PixelLab](https://pixellab.ai/).
2. Open PixelForge Editor.
3. In the **Right Sidebar**, click the gear icon ⚙️ in the **AI Copilot** section.
4. Paste your API key.

### Anthropic Claude & Google Gemini
These models are used for advanced code assistance and complex asset descriptions.
1. Provide your keys in the settings panel (if enabled in your build).
2. Use the AI chat to request modifications to your sprites or game logic.

## 🤖 Using the AI Copilot

### Sprite Generation
1. Select the **AI Copilot** section in the right sidebar.
2. Enter a descriptive prompt (e.g., *"A legendary fire sword, 32x32, 16-bit style"*).
3. Select your desired resolution (32x32, 64x64, or 128x128).
4. Click **Generate**.
5. Once generated, you can:
   - **Click the image**: Apply it directly to your active layer.
   - **Download PNG**: Save the result to your device.
   - **Download JSON**: Save the raw pixel data.

### Tips for Better Prompts
- **Be Specific**: Include colors, styles (e.g., "GameBoy", "NES", "Modern"), and perspective ("Top-down", "Side-scrolling").
- **Resolution Match**: Ensure your prompt matches the selected resolution for the best results.

## 🛡️ Security Note

If you clear your browser's site data or cache, you will need to re-enter your API keys. We recommend keeping a backup of your keys in a secure password manager.
