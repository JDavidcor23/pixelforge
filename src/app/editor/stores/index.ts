import { create } from 'zustand'

import type {
  AnimationFrame,
  Layer,
  SpriteEditorStore,
} from '@/app/editor/types'
import {
  SPRITE_EDITOR_CANVAS,
  SPRITE_EDITOR_DEFAULTS,
  SPRITE_EDITOR_HISTORY,
  SPRITE_EDITOR_TIMELINE,
} from '@/app/editor/constants'
import {
  createEmptyBuffer,
  setPixelInBuffer,
  floodFill as floodFillBuffer,
  createSnapshot,
  cloneLayers,
} from '@/app/editor/lib'

function createInitialLayer(width: number, height: number): Layer {
  return {
    id: crypto.randomUUID(),
    name: `${SPRITE_EDITOR_DEFAULTS.LAYER_NAME_PREFIX} 1`,
    visible: true,
    locked: false,
    opacity: 100,
    pixels: createEmptyBuffer(width, height),
  }
}

function createInitialFrame(layers: Layer[]): AnimationFrame {
  const layerSnapshots: Record<string, Layer['pixels']> = {}

  for (const layer of layers) {
    layerSnapshots[layer.id] = layer.pixels
  }

  return {
    id: crypto.randomUUID(),
    layerSnapshots,
    durationMs: SPRITE_EDITOR_TIMELINE.DEFAULT_FRAME_DURATION_MS,
  }
}

const initialLayer = createInitialLayer(
  SPRITE_EDITOR_CANVAS.DEFAULT_WIDTH,
  SPRITE_EDITOR_CANVAS.DEFAULT_HEIGHT
)

export const useSpriteEditorStore = create<SpriteEditorStore>((set, get) => ({
  // ── State ─────────────────────────────────────────────────────────
  canvasWidth: SPRITE_EDITOR_CANVAS.DEFAULT_WIDTH,
  canvasHeight: SPRITE_EDITOR_CANVAS.DEFAULT_HEIGHT,
  layers: [initialLayer],
  activeLayerId: initialLayer.id,
  activeTool: 'pencil',
  primaryColor: { ...SPRITE_EDITOR_DEFAULTS.PRIMARY_COLOR },
  secondaryColor: { ...SPRITE_EDITOR_DEFAULTS.SECONDARY_COLOR },
  viewport: {
    zoom: SPRITE_EDITOR_CANVAS.DEFAULT_ZOOM,
    offsetX: 0,
    offsetY: 0,
  },
  history: [],
  historyIndex: -1,
  timeline: {
    frames: [createInitialFrame([initialLayer])],
    currentFrameIndex: 0,
    isPlaying: false,
    fps: SPRITE_EDITOR_TIMELINE.DEFAULT_FPS,
  },
  leftSidebarTab: 'layers',
  cursorPixel: null,

  // ── Pixel Actions ─────────────────────────────────────────────────

  setPixel: (layerId, x, y, color) =>
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === layerId
          ? { ...layer, pixels: setPixelInBuffer(layer.pixels, x, y, color) }
          : layer
      ),
    })),

  setPixelBatch: (layerId, pixels) =>
    set((state) => ({
      layers: state.layers.map((layer) => {
        if (layer.id !== layerId) return layer

        let buffer = layer.pixels
        for (const { coord, color } of pixels) {
          buffer = setPixelInBuffer(buffer, coord.x, coord.y, color)
        }

        return { ...layer, pixels: buffer }
      }),
    })),

  floodFill: (layerId, x, y, color) =>
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === layerId
          ? { ...layer, pixels: floodFillBuffer(layer.pixels, x, y, color) }
          : layer
      ),
    })),

  clearLayer: (layerId) =>
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === layerId
          ? {
              ...layer,
              pixels: createEmptyBuffer(state.canvasWidth, state.canvasHeight),
            }
          : layer
      ),
    })),

  // ── Layer Actions ─────────────────────────────────────────────────

  addLayer: () =>
    set((state) => {
      const newLayer: Layer = {
        id: crypto.randomUUID(),
        name: `${SPRITE_EDITOR_DEFAULTS.LAYER_NAME_PREFIX} ${state.layers.length + 1}`,
        visible: true,
        locked: false,
        opacity: 100,
        pixels: createEmptyBuffer(state.canvasWidth, state.canvasHeight),
      }

      return {
        layers: [...state.layers, newLayer],
        activeLayerId: newLayer.id,
      }
    }),

  removeLayer: (id) =>
    set((state) => {
      if (state.layers.length <= 1) return state

      const filtered = state.layers.filter((layer) => layer.id !== id)
      const activeLayerId =
        state.activeLayerId === id ? filtered[0].id : state.activeLayerId

      return { layers: filtered, activeLayerId }
    }),

  toggleLayerVisibility: (id) =>
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === id ? { ...layer, visible: !layer.visible } : layer
      ),
    })),

  toggleLayerLock: (id) =>
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === id ? { ...layer, locked: !layer.locked } : layer
      ),
    })),

  setLayerOpacity: (id, opacity) =>
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === id ? { ...layer, opacity } : layer
      ),
    })),

  reorderLayers: (fromIndex, toIndex) =>
    set((state) => {
      const newLayers = [...state.layers]
      const [moved] = newLayers.splice(fromIndex, 1)
      newLayers.splice(toIndex, 0, moved)

      return { layers: newLayers }
    }),

  setActiveLayer: (id) => set({ activeLayerId: id }),

  // ── Tool Actions ──────────────────────────────────────────────────

  setActiveTool: (tool) => set({ activeTool: tool }),
  setPrimaryColor: (color) => set({ primaryColor: color }),
  setSecondaryColor: (color) => set({ secondaryColor: color }),
  setCursorPixel: (coord) => set({ cursorPixel: coord }),

  // ── Viewport Actions ──────────────────────────────────────────────

  setZoom: (zoom) =>
    set({
      viewport: {
        ...get().viewport,
        zoom: Math.max(
          SPRITE_EDITOR_CANVAS.MIN_ZOOM,
          Math.min(SPRITE_EDITOR_CANVAS.MAX_ZOOM, zoom)
        ),
      },
    }),

  setViewportOffset: (x, y) =>
    set((state) => ({
      viewport: { ...state.viewport, offsetX: x, offsetY: y },
    })),

  // ── History Actions ───────────────────────────────────────────────

  pushHistory: (description) =>
    set((state) => {
      const entry = createSnapshot(state.layers, state.activeLayerId, description)
      const truncated = state.history.slice(0, state.historyIndex + 1)
      const newHistory = [...truncated, entry]

      if (newHistory.length > SPRITE_EDITOR_HISTORY.MAX_ENTRIES) {
        newHistory.shift()
      }

      return {
        history: newHistory,
        historyIndex: newHistory.length - 1,
      }
    }),

  undo: () =>
    set((state) => {
      if (state.historyIndex <= 0) return state

      const newIndex = state.historyIndex - 1
      const entry = state.history[newIndex]

      return {
        historyIndex: newIndex,
        layers: cloneLayers(entry.layers),
        activeLayerId: entry.activeLayerId,
      }
    }),

  redo: () =>
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state

      const newIndex = state.historyIndex + 1
      const entry = state.history[newIndex]

      return {
        historyIndex: newIndex,
        layers: cloneLayers(entry.layers),
        activeLayerId: entry.activeLayerId,
      }
    }),

  // ── Timeline Actions ──────────────────────────────────────────────

  addFrame: () =>
    set((state) => {
      const layerSnapshots: Record<string, Layer['pixels']> = {}
      for (const layer of state.layers) {
        layerSnapshots[layer.id] = layer.pixels
      }

      const newFrame: AnimationFrame = {
        id: crypto.randomUUID(),
        layerSnapshots,
        durationMs: Math.round(1000 / state.timeline.fps),
      }

      return {
        timeline: {
          ...state.timeline,
          frames: [...state.timeline.frames, newFrame],
        },
      }
    }),

  removeFrame: (index) =>
    set((state) => {
      if (state.timeline.frames.length <= 1) return state

      const newFrames = state.timeline.frames.filter((_, i) => i !== index)
      const newCurrentIndex = Math.min(
        state.timeline.currentFrameIndex,
        newFrames.length - 1
      )

      return {
        timeline: {
          ...state.timeline,
          frames: newFrames,
          currentFrameIndex: newCurrentIndex,
        },
      }
    }),

  setCurrentFrame: (index) =>
    set((state) => ({
      timeline: { ...state.timeline, currentFrameIndex: index },
    })),

  setFps: (fps) =>
    set((state) => ({
      timeline: {
        ...state.timeline,
        fps: Math.max(
          SPRITE_EDITOR_TIMELINE.MIN_FPS,
          Math.min(SPRITE_EDITOR_TIMELINE.MAX_FPS, fps)
        ),
      },
    })),

  togglePlayback: () =>
    set((state) => ({
      timeline: { ...state.timeline, isPlaying: !state.timeline.isPlaying },
    })),

  // ── Sidebar Actions ───────────────────────────────────────────────

  setLeftSidebarTab: (tab) => set({ leftSidebarTab: tab }),
}))


