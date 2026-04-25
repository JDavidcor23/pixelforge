# PixelForge Technical Architecture

This document provides a deep dive into the architectural decisions and implementation details of PixelForge.

## 🏛️ Architectural Philosophy

PixelForge follows a **Feature-Based (Screaming) Architecture**. Unlike traditional "Folder-by-Type" structures (components/, hooks/, utils/), PixelForge groups logic by **Domain Feature**.

### Why?
1. **Locality of Change**: When working on the "Layers" feature, all related components, hooks, and types are in one place.
2. **Scalability**: New features can be added without bloating global directories.
3. **Decoupling**: Features interact through a centralized state (Zustand), keeping the UI components thin and purely presentational.

## 🧠 State Management: The Slice Pattern

We use [Zustand](https://github.com/pmnd.rs/zustand) with a modular slice pattern to manage the complex state of a pixel editor.

### Modular Slices
The store is divided into specialized slices (found in `src/app/editor/stores/slices/`):
- `pixel.slice.ts`: Core pixel manipulation logic.
- `layer.slice.ts`: Layer stack management and compositing.
- `history.slice.ts`: Undo/Redo state tracking.
- `compound.slice.ts`: The "Orchestrator" slice that combines actions from multiple slices.

### Granular Selectors
To prevent unnecessary re-renders in a high-performance canvas app, we enforce the use of **granular selectors**:
```typescript
// Good: Only re-renders when activeTool changes
const activeTool = useSpriteEditorStore(state => state.activeTool);

// Bad: Re-renders on ANY state change
const state = useSpriteEditorStore();
```

## 🎨 Rendering Engine: Konva.js

PixelForge uses [Konva.js](https://konvajs.org/) for GPU-accelerated 2D rendering.

### Infinite Canvas Pattern
The editor implements an "Infinite Canvas" pattern:
1. **Dynamic Scaling**: The canvas tracks the parent container size via `ResizeObserver`.
2. **Coordinate Mapping**: World coordinates (pixels) are decoupled from Screen coordinates (UI).
3. **Layered Stacks**: Each sprite layer is rendered as a separate Konva `Layer` to optimize redraws.

### Pixel vs. Texture
For performance, high-resolution sprites (128px+) are rendered as native canvas textures instead of individual Konva `Rect` objects. This allows us to handle thousands of pixels at 60 FPS.

## 🤖 AI Integration Flow

The AI Copilot is a multi-stage pipeline:
1. **Prompt Processing**: User input is sent to the configured AI (PixelLab, Gemini, or Claude).
2. **Protocol Conversion**: AI responses are parsed from "PixelForge Markdown" (PFM) or Base64 images.
3. **Canvas Synchronization**: Generated assets are injected into the Zustand store and automatically synchronized with the Konva renderer.
4. **Local Persistence**: API keys are stored in `localStorage` for privacy, and never touch the backend.

## 🎞️ Animation Pipeline

Animations are managed through a `timeline` state:
- **Frames**: An array of layer stacks representing individual moments in time.
- **Onion Skinning**: The renderer optionally draws adjacent frames with reduced opacity to assist artists.
- **Playback**: A dedicated hook `useAnimationPlayback` manages the frame-switching interval based on the defined FPS.

## 🏗️ Project Structure

```bash
src/
├── app/editor/
│   ├── sprites/
│   │   ├── features/      # Feature domains (Layers, Timeline, Tools)
│   │   ├── hooks/         # Feature-bridging hooks
│   │   └── components/    # Feature-specific UI
│   └── stores/
│       ├── slices/        # Logic chunks (Zustand)
│       └── index.ts       # Store assembly
```
