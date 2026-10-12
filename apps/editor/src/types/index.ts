import type { LucideIcon } from 'lucide-react'

export * from './ai-generation'
export * from './auth.types'
export * from './mascot.types'
export * from './account-deletion.types'

import type { Command, DispatchResult } from '@/lib/core/commands'
import type { AssetType, CreateMethod } from './ai-generation'
import type { DocumentPayload } from './document'

export interface RgbaColor {
  readonly r: number
  readonly g: number
  readonly b: number
  readonly a: number
}

/**
 * HSV with alpha (0-255, matching `RgbaColor.a`'s convention) — the
 * ColorPicker's sticky local representation. See `hexToHsv`/`hsvToHex` in
 * `lib/color-utils.ts` and `useColorPicker.hook.ts`.
 */
export interface HsvColor {
  readonly h: number
  readonly s: number
  readonly v: number
  readonly a: number
}

export interface PixelCoord {
  readonly x: number
  readonly y: number
}

/**
 * Flat RGBA pixel buffer: row-major, 4 bytes per pixel (`i = (y*w+x)*4`).
 * Replaces the old `RgbaColor[][]` representation (phase 1 of
 * migrate-to-rust-core) — this shape round-trips through `ImageData` /
 * `putImageData` with zero per-pixel object allocation, and maps directly
 * onto the `&mut [u8]` buffers the Rust/Wasm core will operate on later.
 */
export interface PixelBuffer {
  readonly w: number
  readonly h: number
  readonly data: Uint8ClampedArray
}

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

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
  /**
   * The frame+layer the floating selection was lifted FROM (set when
   * `floatSelection()` captures `floatingPixels`). A floating selection must
   * always bake back into its SOURCE, never whatever layer/frame happens to
   * be active at commit time — `commitTransformation` resolves against these,
   * not `activeLayerId`/the current frame. Undefined until a selection is
   * floated.
   */
  readonly sourceFrameId?: string
  readonly sourceLayerId?: string
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

export interface ViewportState {
  readonly zoom: number
  readonly offsetX: number
  readonly offsetY: number
}

/**
 * Local-draft lifecycle gate (phase 1, D8). `'loading'` until
 * `useDocumentPersistence` has run the legacy migration and restored (or
 * initialized) the draft; autosave and canvas rendering both wait for
 * `'ready'` so an in-flight restore can never be clobbered by an empty save.
 */
export type DocStatus = 'loading' | 'ready'

/**
 * Visible autosave status (Sprite Studio v2 batch 4, TopBar). `'idle'` means
 * nothing has changed yet THIS session (the draft may still be saved from a
 * previous session — see `isPersistent` for whether saving works at all).
 * `document-persistence.controller.ts` drives the `'saving'` ->
 * `'saved'`/`'error'` transitions around its own debounced `save()`.
 */
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

// ── Animation Types ─────────────────────────────────────────────────────────

// Side-view sprites only walk left or right. Compass directions were dropped
// (top-down framing) — revisit if a top-down view is added later. Only shown
// for `character` assets — non-character motions have no facing.
export type AnimationDirection = 'left' | 'right'

// ── Core Editor Store ────────────────────────────────────────────────────────

export interface SpriteEditorState {
  readonly canvasWidth: number
  readonly canvasHeight: number
  readonly layers: Layer[]
  readonly activeLayerId: string
  readonly activeTool: ToolType
  readonly primaryColor: RgbaColor
  readonly secondaryColor: RgbaColor
  readonly cursorPixel: PixelCoord | null
  /** Monotonic counter bumped by `dispatch` whenever the document content changes — the autosave trigger (phase 2, D14). */
  readonly docRevision: number
  readonly canUndo: boolean
  readonly canRedo: boolean
  /** Mirrors the core's `strokeState !== null` — lets UI hooks detect a stroke the core ended EXTERNALLY mid-drag (judgment-day round 2). */
  readonly isStrokeOpen: boolean
  /** Per-layer dirty counter (judgment-day round 2) — the Konva render contract keys on this, not pixel-buffer identity. */
  readonly layerRevisions: Readonly<Record<string, number>>
  readonly timeline: Timeline
  readonly frameClipboard: AnimationFrame[] | null
  readonly selection: SelectionState | null
  readonly clipboard: PixelBuffer | null
  readonly lastAIReferenceBase64: string | null
  readonly docStatus: DocStatus
  readonly saveStatus: SaveStatus
  /** `Date.now()` timestamp of the last successful autosave, or `null` before the first one this session. */
  readonly lastSavedAt: number | null
  /** Human-readable reason for the last failed save, or `null` when `saveStatus !== 'error'`. */
  readonly saveError: string | null
  /** `false` once IndexedDB failed to open and drafts are no longer being saved — mirrors `useDocumentPersistence`'s own return value for components that can't mount that hook a second time. */
  readonly isPersistent: boolean
}

export interface SpriteEditorActions {
  /**
   * Command-dispatch seam (phase 2, D3/D5) — the SINGLE entry point for
   * every pixel/frame/layer mutation, undoable or not. Undoable: pixel
   * strokes (`stroke.begin/points/end`), bucket fill (`fill`), frame
   * add/remove, AI Copilot document replace. Non-undoable (phase 2b, D3):
   * layer CRUD, frame select/paste, selection/clipboard pixel ops — these
   * still go through `dispatch`, just without pushing a history entry, so
   * the document (`timeline.frames[i].layers`) has exactly one owner. See
   * `lib/core/commands.ts` for the full `Command` union and the
   * undoable/non-undoable split.
   */
  dispatch: (cmd: Command) => DispatchResult
  exportDocument: () => DocumentPayload
  importDocument: (payload: DocumentPayload) => void
  addLayer: () => void
  removeLayer: (id: string) => void
  toggleLayerVisibility: (id: string) => void
  toggleLayerLock: (id: string) => void
  setLayerOpacity: (id: string, opacity: number) => void
  reorderLayers: (fromIndex: number, toIndex: number) => void
  setActiveLayer: (id: string) => void
  updateLayerName: (id: string, name: string) => void
  setActiveTool: (tool: ToolType) => void
  setPrimaryColor: (color: RgbaColor) => void
  setSecondaryColor: (color: RgbaColor) => void
  setCursorPixel: (coord: PixelCoord | null) => void
  undo: () => void
  redo: () => void
  addFrame: () => void
  removeFrame: (index: number) => void
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
  copySelection: () => void
  cutSelection: () => void
  pasteClipboard: () => void
  deleteSelection: () => void

  overwriteWithPixels: (pixels: PixelBuffer, referenceBase64?: string) => void
  importAnimationFrames: (frames: PixelBuffer[], frameDurationMs: number) => void
  setLastAIReferenceBase64: (base64: string | null) => void
  setDocStatus: (status: DocStatus) => void
}

export type SpriteEditorStore = SpriteEditorState & SpriteEditorActions

// ── Sprite Studio v2 shell ───────────────────────────────────────────────────

/** Tabs in the right-hand Inspector panel. */
export type InspectorTabId = 'properties' | 'create' | 'animate'

/** Tabs in the bottom panel (frame timeline vs. the asset library). */
export type BottomPanelTabId = 'timeline' | 'assets'

// ── UI Store ─────────────────────────────────────────────────────────────────

export interface EditorUIState {
  /** Shell-level Settings modal. Session only — not persisted. */
  readonly settingsOpen: boolean
  /** Shell-level "Delete my account" dialog (editor-auth change). Session only — not persisted. */
  readonly deleteAccountDialogOpen: boolean
  /** Calm confirmation banner shown once, right after a successful account deletion. Session only. */
  readonly accountDeletedNoticeVisible: boolean
  readonly ui: {
    readonly leftSidebarOpen: boolean
    readonly rightSidebarOpen: boolean
    readonly timelineOpen: boolean
    readonly toolbarOpen: boolean
    readonly toolbarPosition: { readonly x: number; readonly y: number } | null
    readonly inspectorTab: InspectorTabId
    readonly bottomPanelTab: BottomPanelTabId
    /** Create tab, step 2 — how the user wants to produce the asset (draw/generate/import). */
    readonly createMethod: CreateMethod
    /**
     * Create tab, step 1 — lifted out of `CreateTab` local state (Sprite
     * Studio v2 batch 2) so the Animate tab can read/edit the same asset type
     * without the two tabs drifting out of sync.
     */
    readonly createAssetType: AssetType
    /**
     * One-shot nonce bumped by `requestFocusPrompt` to ask the Create >
     * Generate panel to focus its prompt textarea (e.g. from the Assets tab's
     * "New asset" tile). `0` means "never requested" — never persisted at a
     * non-zero value, see `ui.store.ts`'s `partialize`.
     */
    readonly focusPromptRequest: number
    /** Resizable rail/panel widths (left layers rail, right inspector) in px — see RESIZABLE_PANELS. */
    readonly leftSidebarWidth: number
    readonly rightSidebarWidth: number
    /** Resizable bottom panel (timeline/assets) height in px — see RESIZABLE_PANELS. */
    readonly bottomPanelHeight: number
  }
}

export interface EditorUIActions {
  openSettings: () => void
  closeSettings: () => void
  openDeleteAccountDialog: () => void
  closeDeleteAccountDialog: () => void
  showAccountDeletedNotice: () => void
  dismissAccountDeletedNotice: () => void
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
  requestFocusPrompt: () => void
  setLeftSidebarWidth: (width: number) => void
  setRightSidebarWidth: (width: number) => void
  setBottomPanelHeight: (height: number) => void
  /** Restores the three resizable panels to their default sizes AND expands any collapsed one. */
  resetPanelSizes: () => void
}

export type EditorUIStore = EditorUIState & EditorUIActions

// ── Prefs Store ───────────────────────────────────────────────────────────────

export interface EditorPrefsState {
  readonly viewport: ViewportState
  readonly palette: RgbaColor[]
  readonly showGrid: boolean
  readonly onionSkinEnabled: boolean
  /** BYOK: when set, generations bill this user's own Retro Diffusion balance. */
  readonly retroDiffusionApiKey: string | null
}

export interface EditorPrefsActions {
  setZoom: (zoom: number) => void
  setViewportOffset: (x: number, y: number) => void
  resetViewport: () => void
  saveColor: (color: RgbaColor) => void
  removeColor: (color: RgbaColor) => void
  setShowGrid: (show: boolean) => void
  toggleOnionSkin: () => void
  setRetroDiffusionApiKey: (key: string | null) => void
}

export type EditorPrefsStore = EditorPrefsState & EditorPrefsActions

// ── Editor shell ─────────────────────────────────────────────────────────────

export interface EditorNavItem {
  href: string
  label: string
  icon: LucideIcon
}
