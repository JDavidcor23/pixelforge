# PixelForge 🚀

PixelForge is a state-of-the-art, browser-based 2D game builder designed for professional game developers and artists. It combines traditional pixel art precision with cutting-edge AI workflows, allowing you to create, animate, and deploy game assets with unprecedented speed.

![PixelForge Presentation](./src/assets/presentation.png)

## ✨ Core Features

### 🎨 Professional Sprite Studio
- **Infinite Canvas Pattern**: GPU-accelerated rendering using Konva.js with support for large-scale pixel art.
- **Advanced Layer System**: Multi-layer compositing with opacity control, visibility toggles, and locking mechanisms.
- **Pixel-Perfect Tools**: Precision Pencil, Eraser, Flood Fill, and Selection tools designed for high-end pixel art.
- **Real-time Performance**: Optimized to maintain 60 FPS even with complex multi-layer sprites.

### 🤖 AI Copilot Ecosystem
- **PixelLab AI Integration**: Generate production-ready pixel art directly from natural language prompts.
- **Multi-Model Support**: Leverages Anthropic Claude and Google Gemini for sophisticated code assistance and asset generation.
- **Smart History**: Track and manage AI-generated assets with local caching and one-click application to the canvas.
- **Metadata Aware**: AI-generated sprites automatically sync with canvas dimensions and layer metadata.

### 🎞️ Animation & Timeline
- **Frame-by-Frame Animation**: Traditional animation workflow with a dedicated timeline bar.
- **Onion Skinning**: Visualize previous and next frames for smooth motion transitions.
- **Playback Control**: Real-time animation preview with adjustable FPS and looping options.
- **Frame Clipboard**: Batch copy, paste, and reorder frames to speed up animation cycles.

### 📦 Asset Management & Export
- **Smart Palette**: Save and manage custom color palettes with local persistence.
- **Multi-Format Export**: Export individual frames or full sprite sheets (atlas) optimized for game engines.
- **Source Integrity**: Export raw JSON data of your sprites for programmatic use or further editing.

## 🏗️ Technical Architecture

PixelForge is built with a **Screaming Architecture** (Feature-based) to ensure maximum maintainability and scalability.

- **Frontend**: [Next.js 14](https://nextjs.org/) (App Router) + [TypeScript](https://www.typescriptlang.org/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) with a **Modular Slice Pattern**.
- **Rendering**: [Konva.js](https://konvajs.org/) for the high-performance 2D canvas.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) for a utility-first, performant UI.
- **Backend/Auth**: [Supabase](https://supabase.com/) for cloud storage and user synchronization.
- **Local Persistence**: Integrated browser `localStorage` for API keys and UI preferences, prioritizing security and privacy.

### Project Structure Breakdown

```
src/
├── app/                        # Next.js App Router (Features & Routing)
│   ├── editor/                 # Core Editor implementation
│   │   ├── sprites/            # Sprite creation module
│   │   │   ├── features/       # Feature-specific components (Layers, Tools, AI)
│   │   │   ├── hooks/          # Custom hooks for canvas and state interaction
│   │   │   └── types/          # Module-specific type definitions
│   │   └── stores/             # Modular Zustand slices (Compound, Pixel, Tool, etc.)
├── components/                 # Shared UI components (Atomic Design)
├── constants/                  # Global immutable constants (UPPER_SNAKE_CASE)
└── lib/                        # Infrastructure-level utilities and API clients
```

## 🚀 Getting Started

### Prerequisites

- **Node.js**: 18.x or higher
- **Package Manager**: pnpm (recommended), npm, or bun
- **Supabase Account**: For authentication and cloud storage
- **AI Keys**: PixelLab, Gemini, or Claude API keys (Optional)

### Installation

1. **Clone & Enter**:
   ```bash
   git clone https://github.com/JDavidcor23/pixelforge.git
   cd pixelforge
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Configure `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

4. **Launch Development**:
   ```bash
   npm run dev
   ```

## 📖 Feature Documentation

For detailed technical guides on specific modules:
- [AI Copilot Setup](./docs/ai-setup.md)
- [Architecture Deep Dive](./docs/architecture.md)
- [Custom Tools Development](./docs/tools-guide.md)

## 🛡️ Security & Privacy

We take developer privacy seriously. **All sensitive API keys are stored exclusively in your browser's `localStorage`.** They are never sent to or stored on our servers, ensuring your tokens remain under your control.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
