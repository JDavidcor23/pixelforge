import type {
  AnimationFrame,
  AssetType,
  BottomPanelTabId,
  CreateMethod,
  DocStatus,
  InspectorTabId,
  Layer,
  PixelBuffer,
  PixelCoord,
  QualityTier,
  RgbaColor,
  SaveStatus,
  SelectionState,
  Timeline,
  ToolType,
  ViewportState,
} from '@/types'
import type { Command, DispatchResult } from '@/lib/core/commands'
import type { DocumentPayload } from '@/types/document'

// ── Core Slice (document ownership + dispatch seam, phase 2) ────────────────

export interface CoreSlice {
  docRevision: number
  canUndo: boolean
  canRedo: boolean
  /** Mirrors the core's `strokeState !== null` — lets UI hooks detect a stroke the core ended EXTERNALLY (undo/redo/tool switch/frame switch) mid-drag. */
  isStrokeOpen: boolean
  /** Per-layer dirty counter (judgment-day round 2) — the render contract Konva keys its per-layer memoization on, instead of pixel-buffer identity. */
  layerRevisions: Readonly<Record<string, number>>
  dispatch: (cmd: Command) => DispatchResult
  undo: () => void
  redo: () => void
  exportDocument: () => DocumentPayload
  importDocument: (payload: DocumentPayload) => void
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
  /** Recentres the sprite and snaps zoom to SPRITE_EDITOR_CANVAS.RESET_VIEW_ZOOM. */
  resetViewport: () => void
}

// ── Timeline Slice (pure state only) ────────────────────────────────────────

export interface TimelineSlice {
  timeline: Timeline
  frameClipboard: AnimationFrame[] | null
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
  settingsOpen: boolean
  deleteAccountDialogOpen: boolean
  accountDeletedNoticeVisible: boolean
  ui: {
    leftSidebarOpen: boolean
    rightSidebarOpen: boolean
    timelineOpen: boolean
    toolbarOpen: boolean
    toolbarPosition: { x: number; y: number } | null
    inspectorTab: InspectorTabId
    bottomPanelTab: BottomPanelTabId
    createMethod: CreateMethod
    createAssetType: AssetType
    /** Create tab > Generate, "Quality" selector — persisted like `createAssetType` above. */
    createQualityTier: QualityTier
    focusPromptRequest: number
    leftSidebarWidth: number
    rightSidebarWidth: number
    bottomPanelHeight: number
  }
  toggleLeftSidebar: () => void
  toggleRightSidebar: () => void
  toggleTimeline: () => void
  toggleToolbar: () => void
  toggleZenMode: () => void
  setToolbarPosition: (position: { x: number; y: number } | null) => void
  setInspectorTab: (tab: InspectorTabId) => void
  setBottomPanelTab: (tab: BottomPanelTabId) => void
  setCreateMethod: (method: CreateMethod) => void
  setCreateAssetType: (assetType: AssetType) => void
  setCreateQualityTier: (tier: QualityTier) => void
  requestFocusPrompt: () => void
  setLeftSidebarWidth: (width: number) => void
  setRightSidebarWidth: (width: number) => void
  setBottomPanelHeight: (height: number) => void
  resetPanelSizes: () => void
  openSettings: () => void
  closeSettings: () => void
  openDeleteAccountDialog: () => void
  closeDeleteAccountDialog: () => void
  showAccountDeletedNotice: () => void
  dismissAccountDeletedNotice: () => void
}

// ── View Prefs Slice ─────────────────────────────────────────────────────────

export interface ViewPrefsSlice {
  showGrid: boolean
  onionSkinEnabled: boolean
  setShowGrid: (show: boolean) => void
  toggleOnionSkin: () => void
}

// ── Document Status Slice (pure state only) ──────────────────────────────────

export interface DocumentStatusSlice {
  docStatus: DocStatus
  setDocStatus: (status: DocStatus) => void
  saveStatus: SaveStatus
  lastSavedAt: number | null
  saveError: string | null
  isPersistent: boolean
}

// ── Compound Slice (orchestration) ───────────────────────────────────────────

export interface CompoundSlice {
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
  // AI Copilot orchestration

  // Native-resolution base64 of the last AI-generated sprite applied to the
  // canvas. Used as the animation reference instead of a small canvas render
  // so the model gets full detail, not an already-downscaled/quantized copy.
  lastAIReferenceBase64: string | null
  setLastAIReferenceBase64: (base64: string | null) => void
  overwriteWithPixels: (pixels: PixelBuffer, referenceBase64?: string) => void
  importAnimationFrames: (frames: PixelBuffer[], frameDurationMs: number) => void
}
