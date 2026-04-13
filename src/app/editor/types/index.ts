export interface RgbaColor {
  readonly r: number
  readonly g: number
  readonly b: number
  readonly a: number
}

export interface PixelCoord {
  readonly x: number
  readonly y: number
}

export type PixelBuffer = RgbaColor[][]

export interface Layer {
  readonly id: string
  readonly name: string
  readonly visible: boolean
  readonly locked: boolean
  readonly opacity: number
  readonly pixels: PixelBuffer
}

export type ToolType = 'pencil' | 'eraser' | 'bucket' | 'eyedropper' | 'select' | 'transform'

export interface SelectionState {
  readonly rect: { x: number; y: number; width: number; height: number }
  readonly rotation: number
  readonly scaleX: number
  readonly scaleY: number
  readonly floatingPixels: PixelBuffer | null
  readonly originalArea: { x: number; y: number; width: number; height: number } | null
}

export interface ToolDefinition {
  readonly type: ToolType
  readonly label: string
  readonly shortcut: string
  readonly iconName: string
}

export interface AnimationFrame {
  readonly id: string
  readonly layers: Layer[]
  readonly activeLayerId: string
  readonly durationMs: number
}

export interface Timeline {
  readonly frames: AnimationFrame[]
  readonly currentFrameIndex: number
  readonly isPlaying: boolean
  readonly fps: number
  readonly loop: boolean
  readonly selectedFrameIndices: number[]
}

export interface HistoryEntry {
  readonly layers: Layer[]
  readonly activeLayerId: string
  readonly description: string
  readonly frames: AnimationFrame[]
  readonly currentFrameIndex: number
}

export interface ViewportState {
  readonly zoom: number
  readonly offsetX: number
  readonly offsetY: number
}

export type LeftSidebarTab = 'layers' | 'assets' | 'code'

export interface SpriteEditorState {
  readonly canvasWidth: number
  readonly canvasHeight: number
  readonly layers: Layer[]
  readonly activeLayerId: string
  readonly activeTool: ToolType
  readonly primaryColor: RgbaColor
  readonly secondaryColor: RgbaColor
  readonly viewport: ViewportState
  readonly history: HistoryEntry[]
  readonly historyIndex: number
  readonly timeline: Timeline
  readonly leftSidebarTab: LeftSidebarTab
  readonly cursorPixel: PixelCoord | null
  readonly selection: SelectionState | null
  readonly palette: RgbaColor[]
  readonly showGrid: boolean
  readonly onionSkinEnabled: boolean
  readonly clipboard: PixelBuffer | null
  readonly frameClipboard: AnimationFrame[] | null
  readonly ui: {
    readonly leftSidebarOpen: boolean
    readonly rightSidebarOpen: boolean
    readonly timelineOpen: boolean
    readonly toolbarOpen: boolean
    readonly toolbarPosition: { readonly x: number; readonly y: number } | null
  }
}

export interface SpriteEditorActions {
  setPixel: (layerId: string, x: number, y: number, color: RgbaColor) => void
  setPixelBatch: (layerId: string, pixels: Array<{ coord: PixelCoord; color: RgbaColor }>) => void
  floodFill: (layerId: string, x: number, y: number, color: RgbaColor) => void
  clearLayer: (layerId: string) => void
  addLayer: () => void
  removeLayer: (id: string) => void
  toggleLayerVisibility: (id: string) => void
  toggleLayerLock: (id: string) => void
  setLayerOpacity: (id: string, opacity: number) => void
  reorderLayers: (fromIndex: number, toIndex: number) => void
  setActiveLayer: (id: string) => void
  setActiveTool: (tool: ToolType) => void
  setPrimaryColor: (color: RgbaColor) => void
  setSecondaryColor: (color: RgbaColor) => void
  setCursorPixel: (coord: PixelCoord | null) => void
  setZoom: (zoom: number) => void
  setViewportOffset: (x: number, y: number) => void
  pushHistory: (description: string) => void
  undo: () => void
  redo: () => void
  addFrame: () => void
  removeFrame: (index: number) => void
  saveCurrentFrameSnapshot: () => void
  restoreFrameSnapshot: (index: number) => void
  setCurrentFrame: (index: number) => void
  setFps: (fps: number) => void
  togglePlayback: () => void
  toggleLoop: () => void
  goToPreviousFrame: () => void
  goToNextFrame: () => void
  setFrameSelection: (indices: number[]) => void
  copySelectedFrames: () => void
  pasteFrames: () => void
  pasteFramesAtEnd: () => void
  setLeftSidebarTab: (tab: LeftSidebarTab) => void
  setSelection: (selection: SelectionState | null) => void
  floatSelection: () => void
  setSelectionTransform: (transform: { x: number; y: number; rotation: number; scaleX: number; scaleY: number }) => void
  commitTransformation: () => void
  saveColor: (color: RgbaColor) => void
  removeColor: (color: RgbaColor) => void
  setShowGrid: (show: boolean) => void
  toggleOnionSkin: () => void
  copySelection: () => void
  cutSelection: () => void
  pasteClipboard: () => void
  deleteSelection: () => void
  updateLayerName: (id: string, name: string) => void
  toggleLeftSidebar: () => void
  toggleRightSidebar: () => void
  toggleTimeline: () => void
  toggleToolbar: () => void
  toggleZenMode: () => void
  setToolbarPosition: (position: { x: number; y: number } | null) => void
}

export type SpriteEditorStore = SpriteEditorState & SpriteEditorActions

