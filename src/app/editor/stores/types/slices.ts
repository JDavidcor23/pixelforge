import type {
  AnimationFrame,
  Layer,
  LeftSidebarTab,
  PixelBuffer,
  PixelCoord,
  RgbaColor,
  SelectionState,
  Timeline,
  ToolType,
  ViewportState,
  HistoryEntry,
} from '@/app/editor/types'

// ── Pixel Slice ──────────────────────────────────────────────────────────────

export interface PixelSlice {
  setPixel: (layerId: string, x: number, y: number, color: RgbaColor) => void
  setPixelBatch: (layerId: string, pixels: Array<{ coord: PixelCoord; color: RgbaColor }>) => void
  floodFill: (layerId: string, x: number, y: number, color: RgbaColor) => void
  clearLayer: (layerId: string) => void
}

// ── Layer Slice ──────────────────────────────────────────────────────────────

export interface LayerSlice {
  layers: Layer[]
  activeLayerId: string
  addLayer: () => void
  removeLayer: (id: string) => void
  toggleLayerVisibility: (id: string) => void
  toggleLayerLock: (id: string) => void
  setLayerOpacity: (id: string, opacity: number) => void
  reorderLayers: (fromIndex: number, toIndex: number) => void
  setActiveLayer: (id: string) => void
  updateLayerName: (id: string, name: string) => void
}

// ── Tool Slice (pure state only) ─────────────────────────────────────────────

export interface ToolSlice {
  activeTool: ToolType
  primaryColor: RgbaColor
  secondaryColor: RgbaColor
  cursorPixel: PixelCoord | null
  setPrimaryColor: (color: RgbaColor) => void
  setSecondaryColor: (color: RgbaColor) => void
  setCursorPixel: (coord: PixelCoord | null) => void
}

// ── Viewport Slice ───────────────────────────────────────────────────────────

export interface ViewportSlice {
  viewport: ViewportState
  setZoom: (zoom: number) => void
  setViewportOffset: (x: number, y: number) => void
}

// ── History Slice (pure state only) ─────────────────────────────────────────

export interface HistorySlice {
  history: HistoryEntry[]
  historyIndex: number
  undo: () => void
  redo: () => void
}

// ── Timeline Slice (pure state only) ────────────────────────────────────────

export interface TimelineSlice {
  timeline: Timeline
  frameClipboard: AnimationFrame[] | null
  saveCurrentFrameSnapshot: () => void
  restoreFrameSnapshot: (index: number) => void
  setFps: (fps: number) => void
  toggleLoop: () => void
  setFrameSelection: (indices: number[]) => void
}

// ── Selection Slice ──────────────────────────────────────────────────────────

export interface SelectionSlice {
  selection: SelectionState | null
  setSelection: (selection: SelectionState | null) => void
  floatSelection: () => void
  setSelectionTransform: (transform: {
    x: number
    y: number
    rotation: number
    scaleX: number
    scaleY: number
  }) => void
  commitTransformation: () => void
}

// ── Palette Slice ────────────────────────────────────────────────────────────

export interface PaletteSlice {
  palette: RgbaColor[]
  saveColor: (color: RgbaColor) => void
  removeColor: (color: RgbaColor) => void
}

// ── Clipboard Slice (pure state only) ───────────────────────────────────────

export interface ClipboardSlice {
  clipboard: PixelBuffer | null
  copySelection: () => void
  cutSelection: () => void
  deleteSelection: () => void
}

// ── UI Slice ─────────────────────────────────────────────────────────────────

export interface UISlice {
  leftSidebarTab: LeftSidebarTab
  ui: {
    leftSidebarOpen: boolean
    rightSidebarOpen: boolean
    timelineOpen: boolean
    toolbarOpen: boolean
    toolbarPosition: { x: number; y: number } | null
  }
  setLeftSidebarTab: (tab: LeftSidebarTab) => void
  toggleLeftSidebar: () => void
  toggleRightSidebar: () => void
  toggleTimeline: () => void
  toggleToolbar: () => void
  toggleZenMode: () => void
  setToolbarPosition: (position: { x: number; y: number } | null) => void
}

// ── View Prefs Slice ─────────────────────────────────────────────────────────

export interface ViewPrefsSlice {
  showGrid: boolean
  onionSkinEnabled: boolean
  setShowGrid: (show: boolean) => void
  toggleOnionSkin: () => void
}

// ── Compound Slice (orchestration) ───────────────────────────────────────────

export interface CompoundSlice {
  // History orchestration
  pushHistory: (description: string) => void
  // Timeline orchestration
  addFrame: () => void
  removeFrame: (index: number) => void
  setCurrentFrame: (index: number) => void
  togglePlayback: () => void
  goToPreviousFrame: () => void
  goToNextFrame: () => void
  copySelectedFrames: () => void
  pasteFrames: () => void
  pasteFramesAtEnd: () => void
  // Tool orchestration
  setActiveTool: (tool: ToolType) => void
  // Clipboard orchestration
  pasteClipboard: () => void
}
