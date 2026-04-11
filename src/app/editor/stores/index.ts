import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type {
  AnimationFrame,
  Layer,
  PixelBuffer,
  SpriteEditorStore,
} from '@/app/editor/types'
import {
  SPRITE_EDITOR_CANVAS,
  SPRITE_EDITOR_COLORS,
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
  transformPixels,
  colorsEqual,
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

export const useSpriteEditorStore = create<SpriteEditorStore>()(
  persist(
    (set, get) => ({
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
      selection: null,
      palette: [],
      showGrid: true,
      clipboard: null,
      ui: {
        leftSidebarOpen: true,
        rightSidebarOpen: true,
        timelineOpen: true,
        toolbarOpen: true,
        toolbarPosition: null, // Si es null, usa el default center-bottom
      },

      // ... rest of actions ...

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

  setActiveTool: (tool) => {
    const state = get()
    
    // If we're leaving transform tool, commit the changes
    if (state.activeTool === 'transform' && tool !== 'transform' && state.selection) {
      state.commitTransformation()
    }
    
    // If we're leaving select tool and NOT going to transform, clear selection
    if (state.activeTool === 'select' && tool !== 'select' && tool !== 'transform') {
      set({ selection: null })
    }

    if (tool === 'transform' && state.selection && !state.selection.floatingPixels) {
      // Defer floating to ensure state sets the tool first if needed
      setTimeout(() => state.floatSelection(), 0)
    }
    set({ activeTool: tool })
  },
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

  setSelection: (selection) => set({ selection }),

  floatSelection: () =>
    set((state) => {
      if (!state.selection || state.selection.floatingPixels) return {}
      
      const { rect } = state.selection
      const activeLayer = state.layers.find((l) => l.id === state.activeLayerId)
      if (!activeLayer) return {}

      const captured: PixelBuffer = []
      for (let y = 0; y < rect.height; y++) {
        captured[y] = []
        for (let x = 0; x < rect.width; x++) {
          const pxY = rect.y + y
          const pxX = rect.x + x
          if (
            pxY >= 0 &&
            pxY < state.canvasHeight &&
            pxX >= 0 &&
            pxX < state.canvasWidth
          ) {
            captured[y][x] = activeLayer.pixels[pxY][pxX]
          } else {
            captured[y][x] = { r: 0, g: 0, b: 0, a: 0 }
          }
        }
      }

      return {
        selection: {
          ...state.selection,
          floatingPixels: captured,
          originalArea: { ...rect },
        },
      }
    }),

  setSelectionTransform: ({ x, y, rotation, scaleX, scaleY }) =>
    set((state) => {
      if (!state.selection) return state
      return {
        selection: {
          ...state.selection,
          rect: { ...state.selection.rect, x, y },
          rotation,
          scaleX,
          scaleY,
        },
      }
    }),

  commitTransformation: () =>
    set((state) => {
      if (!state.selection || !state.selection.floatingPixels) return {}

      const { rect, floatingPixels, originalArea, rotation, scaleX, scaleY } = state.selection
      const activeLayerId = state.activeLayerId

      const newLayers = state.layers.map((layer) => {
        if (layer.id !== activeLayerId) return layer

        const buffer = layer.pixels.map((row) => [...row])

        if (originalArea) {
          for (let y = 0; y < originalArea.height; y++) {
            for (let x = 0; x < originalArea.width; x++) {
              const pixelY = Math.floor(originalArea.y + y)
              const pixelX = Math.floor(originalArea.x + x)
              if (
                pixelY >= 0 &&
                pixelY < state.canvasHeight &&
                pixelX >= 0 &&
                pixelX < state.canvasWidth
              ) {
                buffer[pixelY][pixelX] = { r: 0, g: 0, b: 0, a: 0 }
              }
            }
          }
        }

        const bakedPixels = transformPixels(
          floatingPixels,
          rotation || 0,
          scaleX || 1,
          scaleY || 1,
          state.canvasWidth,
          state.canvasHeight,
          rect.x,
          rect.y
        )

        for (let y = 0; y < state.canvasHeight; y++) {
          for (let x = 0; x < state.canvasWidth; x++) {
            const color = bakedPixels[y][x]
            if (color.a > 0) {
              buffer[y][x] = color
            }
          }
        }

        return { ...layer, pixels: buffer }
      })

      return {
        layers: newLayers,
        selection: null,
      }
    }),

  saveColor: (color) =>
    set((state) => {
      const alreadyExists = state.palette.some((pc) => colorsEqual(pc, color))
      if (alreadyExists || state.palette.length >= SPRITE_EDITOR_COLORS.MAX_PALETTE_COLORS) {
        return state
      }
      return { palette: [...state.palette, color] }
    }),

  removeColor: (color) =>
    set((state) => ({
      palette: state.palette.filter((pc) => !colorsEqual(pc, color)),
    })),

  setShowGrid: (show) => set({ showGrid: show }),

  // ── Clipboard Actions ──────────────────────────────────────────────

  copySelection: () =>
    set((state) => {
      if (!state.selection) return {}

      const { rect } = state.selection
      const activeLayer = state.layers.find((l) => l.id === state.activeLayerId)
      if (!activeLayer) return {}

      const captured: PixelBuffer = []
      for (let y = 0; y < rect.height; y++) {
        captured[y] = []
        for (let x = 0; x < rect.width; x++) {
          const pxY = rect.y + y
          const pxX = rect.x + x
          if (
            pxY >= 0 &&
            pxY < state.canvasHeight &&
            pxX >= 0 &&
            pxX < state.canvasWidth
          ) {
            captured[y][x] = { ...activeLayer.pixels[pxY][pxX] }
          } else {
            captured[y][x] = { r: 0, g: 0, b: 0, a: 0 }
          }
        }
      }

      return { clipboard: captured }
    }),

  cutSelection: () => {
    const state = get()
    if (!state.selection) return

    // Copy first
    state.copySelection()

    // Erase selected pixels
    const { rect } = state.selection
    const activeLayerId = state.activeLayerId

    set((s) => ({
      layers: s.layers.map((layer) => {
        if (layer.id !== activeLayerId) return layer

        const buffer = layer.pixels.map((row) => [...row])
        for (let y = 0; y < rect.height; y++) {
          for (let x = 0; x < rect.width; x++) {
            const pxY = rect.y + y
            const pxX = rect.x + x
            if (
              pxY >= 0 &&
              pxY < s.canvasHeight &&
              pxX >= 0 &&
              pxX < s.canvasWidth
            ) {
              buffer[pxY][pxX] = { r: 0, g: 0, b: 0, a: 0 }
            }
          }
        }

        return { ...layer, pixels: buffer }
      }),
      selection: null,
    }))
  },

  pasteClipboard: () => {
    const state = get()
    if (!state.clipboard) return

    const clipboardHeight = state.clipboard.length
    const clipboardWidth = state.clipboard[0].length

    // If there's an active transform, commit it first
    if (state.activeTool === 'transform' && state.selection?.floatingPixels) {
      state.commitTransformation()
    }

    set({
      selection: {
        rect: { x: 0, y: 0, width: clipboardWidth, height: clipboardHeight },
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        floatingPixels: state.clipboard.map((row) => row.map((px) => ({ ...px }))),
        originalArea: null,
      },
      activeTool: 'transform',
    })
  },

  deleteSelection: () =>
    set((state) => {
      if (!state.selection) return {}

      const { rect } = state.selection
      const activeLayerId = state.activeLayerId

      return {
        layers: state.layers.map((layer) => {
          if (layer.id !== activeLayerId) return layer

          const buffer = layer.pixels.map((row) => [...row])
          for (let y = 0; y < rect.height; y++) {
            for (let x = 0; x < rect.width; x++) {
              const pxY = rect.y + y
              const pxX = rect.x + x
              if (
                pxY >= 0 &&
                pxY < state.canvasHeight &&
                pxX >= 0 &&
                pxX < state.canvasWidth
              ) {
                buffer[pxY][pxX] = { r: 0, g: 0, b: 0, a: 0 }
              }
            }
          }

          return { ...layer, pixels: buffer }
        }),
        selection: null,
      }
    }),

  // ── UI Actions ────────────────────────────────────────────────────

  toggleLeftSidebar: () =>
    set((state) => ({
      ui: { ...state.ui, leftSidebarOpen: !state.ui.leftSidebarOpen },
    })),

  toggleRightSidebar: () =>
    set((state) => ({
      ui: { ...state.ui, rightSidebarOpen: !state.ui.rightSidebarOpen },
    })),

  toggleTimeline: () =>
    set((state) => ({
      ui: { ...state.ui, timelineOpen: !state.ui.timelineOpen },
    })),

  toggleToolbar: () =>
    set((state) => ({
      ui: { ...state.ui, toolbarOpen: !state.ui.toolbarOpen },
    })),

  toggleZenMode: () =>
    set((state) => {
      const anyOpen =
        state.ui.leftSidebarOpen ||
        state.ui.rightSidebarOpen ||
        state.ui.timelineOpen ||
        state.ui.toolbarOpen

      const newState = !anyOpen

      return {
        ui: {
          ...state.ui,
          leftSidebarOpen: newState,
          rightSidebarOpen: newState,
          timelineOpen: newState,
          toolbarOpen: newState,
        },
      }
    }),

  setToolbarPosition: (position) =>
    set((state) => ({
      ui: { ...state.ui, toolbarPosition: position },
    })),
    }),
    {
      name: 'sprite-editor-palette',
      partialize: (state) => ({
        palette: state.palette,
        primaryColor: state.primaryColor,
        secondaryColor: state.secondaryColor,
        showGrid: state.showGrid,
        ui: state.ui,
      }),
    }
  )
)

