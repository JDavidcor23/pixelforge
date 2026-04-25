import { useShallow } from 'zustand/react/shallow'

export { useSpriteEditorStore } from '@/app/editor/stores'
export { useEditorUIStore } from '@/app/editor/stores/ui.store'
export { useEditorPrefsStore } from '@/app/editor/stores/prefs.store'

import { useSpriteEditorStore } from '@/app/editor/stores'
import { useEditorUIStore } from '@/app/editor/stores/ui.store'
import { useEditorPrefsStore } from '@/app/editor/stores/prefs.store'

/**
 * ── Core State Selectors ────────────────────────────────────────────────────
 * These hooks provide read-only access to the central sprite editor state.
 */

/**
 * Returns the current list of layers in the active sprite.
 */
export const useLayers = () => useSpriteEditorStore((s) => s.layers)

/**
 * Returns the opacity (0-100) of the currently active layer.
 */
export const useActiveLayerOpacity = () =>
  useSpriteEditorStore(
    (s) => s.layers.find((l) => l.id === s.activeLayerId)?.opacity ?? 100
  )

/**
 * Returns metadata for all layers (ID, name, visibility, locked status).
 * Uses stringification to prevent unnecessary re-renders.
 */
export const useLayersMetadata = () => {
  const metadataStr = useSpriteEditorStore((s) =>
    JSON.stringify(
      s.layers.map((l) => ({
        id: l.id,
        name: l.name,
        visible: l.visible,
        locked: l.locked,
      }))
    )
  )
  return JSON.parse(metadataStr) as {
    id: string
    name: string
    visible: boolean
    locked: boolean
  }[]
}

/**
 * Returns the ID of the currently selected layer.
 */
export const useActiveLayerId = () => useSpriteEditorStore((s) => s.activeLayerId)

/**
 * Returns the currently active tool (pencil, eraser, etc.).
 */
export const useActiveTool = () => useSpriteEditorStore((s) => s.activeTool)

/**
 * Returns the primary drawing color.
 */
export const usePrimaryColor = () => useSpriteEditorStore((s) => s.primaryColor)

/**
 * Returns the secondary drawing color.
 */
export const useSecondaryColor = () => useSpriteEditorStore((s) => s.secondaryColor)

/**
 * Returns the coordinates of the pixel under the cursor.
 */
export const useCursorPixel = () => useSpriteEditorStore((s) => s.cursorPixel)

/**
 * Returns the timeline state (frames, current frame, FPS, playback status).
 */
export const useTimeline = () => useSpriteEditorStore((s) => s.timeline)

/**
 * Returns the current position in the undo/redo history.
 */
export const useHistoryIndex = () => useSpriteEditorStore((s) => s.historyIndex)

/**
 * Returns the total number of items in the undo/redo history.
 */
export const useHistoryLength = () => useSpriteEditorStore((s) => s.history.length)

/**
 * Returns the current selection state (active selection, floating pixels, etc.).
 */
export const useSelection = () => useSpriteEditorStore((s) => s.selection)

/**
 * Returns the dimensions (width, height) of the active canvas.
 */
export const useCanvasDimensions = () =>
  useSpriteEditorStore(
    useShallow((s) => ({ width: s.canvasWidth, height: s.canvasHeight }))
  )

/**
 * ── Pixel Actions ────────────────────────────────────────────────────────────
 * Hooks for manipulating individual pixels or pixel groups.
 */

/**
 * Action to set a single pixel's color on the active layer.
 */
export const useSetPixel = () => useSpriteEditorStore((s) => s.setPixel)

/**
 * Action to set multiple pixels at once (batch update).
 */
export const useSetPixelBatch = () => useSpriteEditorStore((s) => s.setPixelBatch)

/**
 * Action to perform a flood fill starting from a specific coordinate.
 */
export const useFloodFill = () => useSpriteEditorStore((s) => s.floodFill)

/**
 * Action to clear all pixels from a specific layer.
 */
export const useClearLayer = () => useSpriteEditorStore((s) => s.clearLayer)

/**
 * ── Layer Actions ────────────────────────────────────────────────────────────
 * Hooks for managing the layer stack.
 */

/**
 * Action to add a new layer to the sprite.
 */
export const useAddLayer = () => useSpriteEditorStore((s) => s.addLayer)

/**
 * Action to remove a layer by ID.
 */
export const useRemoveLayer = () => useSpriteEditorStore((s) => s.removeLayer)

/**
 * Action to toggle a layer's visibility.
 */
export const useToggleLayerVisibility = () =>
  useSpriteEditorStore((s) => s.toggleLayerVisibility)

/**
 * Action to toggle a layer's locked status.
 */
export const useToggleLayerLock = () => useSpriteEditorStore((s) => s.toggleLayerLock)

/**
 * Action to update a layer's opacity.
 */
export const useSetLayerOpacity = () => useSpriteEditorStore((s) => s.setLayerOpacity)

/**
 * Action to reorder layers in the stack.
 */
export const useReorderLayers = () => useSpriteEditorStore((s) => s.reorderLayers)

/**
 * Action to change the active layer.
 */
export const useSetActiveLayer = () => useSpriteEditorStore((s) => s.setActiveLayer)

/**
 * Action to update a layer's display name.
 */
export const useUpdateLayerName = () => useSpriteEditorStore((s) => s.updateLayerName)

/**
 * ── Tool Actions ─────────────────────────────────────────────────────────────
 * Hooks for managing editor tools and settings.
 */

/**
 * Action to change the active tool.
 */
export const useSetActiveTool = () => useSpriteEditorStore((s) => s.setActiveTool)

/**
 * Action to update the primary color.
 */
export const useSetPrimaryColor = () => useSpriteEditorStore((s) => s.setPrimaryColor)

/**
 * Action to update the secondary color.
 */
export const useSetSecondaryColor = () => useSpriteEditorStore((s) => s.setSecondaryColor)

/**
 * Action to update the cursor's pixel position.
 */
export const useSetCursorPixel = () => useSpriteEditorStore((s) => s.setCursorPixel)

/**
 * ── History Actions ──────────────────────────────────────────────────────────
 * Hooks for undo, redo, and history management.
 */

/**
 * Action to push a new state to the undo history.
 */
export const usePushHistory = () => useSpriteEditorStore((s) => s.pushHistory)

/**
 * Action to undo the last change.
 */
export const useUndo = () => useSpriteEditorStore((s) => s.undo)

/**
 * Action to redo the last undone change.
 */
export const useRedo = () => useSpriteEditorStore((s) => s.redo)

/**
 * ── Timeline Actions ─────────────────────────────────────────────────────────
 * Hooks for animation frame management.
 */

/**
 * Action to add a new animation frame.
 */
export const useAddFrame = () => useSpriteEditorStore((s) => s.addFrame)

/**
 * Action to remove an animation frame.
 */
export const useRemoveFrame = () => useSpriteEditorStore((s) => s.removeFrame)

/**
 * Action to switch the current animation frame.
 */
export const useSetCurrentFrame = () => useSpriteEditorStore((s) => s.setCurrentFrame)

/**
 * Action to set the animation frames per second.
 */
export const useSetFps = () => useSpriteEditorStore((s) => s.setFps)

/**
 * Action to start or stop animation playback.
 */
export const useTogglePlayback = () => useSpriteEditorStore((s) => s.togglePlayback)

/**
 * Action to toggle animation looping.
 */
export const useToggleLoop = () => useSpriteEditorStore((s) => s.toggleLoop)

/**
 * Action to go to the previous frame.
 */
export const useGoToPreviousFrame = () => useSpriteEditorStore((s) => s.goToPreviousFrame)

/**
 * Action to go to the next frame.
 */
export const useGoToNextFrame = () => useSpriteEditorStore((s) => s.goToNextFrame)

/**
 * Action to set the selection of frames in the timeline.
 */
export const useSetFrameSelection = () => useSpriteEditorStore((s) => s.setFrameSelection)

/**
 * Action to copy the currently selected frames.
 */
export const useCopySelectedFrames = () => useSpriteEditorStore((s) => s.copySelectedFrames)

/**
 * Action to paste frames at the current position.
 */
export const usePasteFrames = () => useSpriteEditorStore((s) => s.pasteFrames)

/**
 * Action to paste frames at the end of the timeline.
 */
export const usePasteFramesAtEnd = () => useSpriteEditorStore((s) => s.pasteFramesAtEnd)

/**
 * Returns the current contents of the frame clipboard.
 */
export const useFrameClipboard = () => useSpriteEditorStore((s) => s.frameClipboard)

/**
 * ── Selection Actions ────────────────────────────────────────────────────────
 * Hooks for managing the canvas selection and transformations.
 */

/**
 * Action to define a new selection area.
 */
export const useSetSelection = () => useSpriteEditorStore((s) => s.setSelection)

/**
 * Action to "float" the current selection (detach pixels from layer).
 */
export const useFloatSelection = () => useSpriteEditorStore((s) => s.floatSelection)

/**
 * Action to update the transformation (scale, rotate) of a floating selection.
 */
export const useSetSelectionTransform = () =>
  useSpriteEditorStore((s) => s.setSelectionTransform)

/**
 * Action to commit a transformation back to the active layer.
 */
export const useCommitTransformation = () =>
  useSpriteEditorStore((s) => s.commitTransformation)

/**
 * ── Clipboard Actions ────────────────────────────────────────────────────────
 * Hooks for copy, cut, and paste of pixel data.
 */

/**
 * Returns the current pixel clipboard contents.
 */
export const useClipboard = () => useSpriteEditorStore((s) => s.clipboard)

/**
 * Action to copy the current selection to the clipboard.
 */
export const useCopySelection = () => useSpriteEditorStore((s) => s.copySelection)

/**
 * Action to cut the current selection to the clipboard.
 */
export const useCutSelection = () => useSpriteEditorStore((s) => s.cutSelection)

/**
 * Action to paste clipboard contents onto the canvas.
 */
export const usePasteClipboard = () => useSpriteEditorStore((s) => s.pasteClipboard)

/**
 * Action to delete the current selection.
 */
export const useDeleteSelection = () => useSpriteEditorStore((s) => s.deleteSelection)

/**
 * ── AI Copilot Orchestration ───────────────────────────────────────────────
 */

/**
 * Action to overwrite a layer with a batch of pixels (used by AI generation).
 */
export const useOverwriteWithPixels = () => useSpriteEditorStore((s) => s.overwriteWithPixels)

/**
 * ── UI State & Actions ───────────────────────────────────────────────────────
 */

/**
 * Returns the active tab in the left sidebar.
 */
export const useLeftSidebarTab = () => useEditorUIStore((s) => s.leftSidebarTab)

/**
 * Returns the full UI state (visibilities, positions).
 */
export const useUIState = () => useEditorUIStore((s) => s.ui)

/**
 * Action to change the active tab in the left sidebar.
 */
export const useSetLeftSidebarTab = () => useEditorUIStore((s) => s.setLeftSidebarTab)

/**
 * Action to toggle the visibility of the left sidebar.
 */
export const useToggleLeftSidebar = () => useEditorUIStore((s) => s.toggleLeftSidebar)

/**
 * Action to toggle the visibility of the right sidebar.
 */
export const useToggleRightSidebar = () => useEditorUIStore((s) => s.toggleRightSidebar)

/**
 * Action to toggle the visibility of the timeline bar.
 */
export const useToggleTimeline = () => useEditorUIStore((s) => s.toggleTimeline)

/**
 * Action to toggle the visibility of the main toolbar.
 */
export const useToggleToolbar = () => useEditorUIStore((s) => s.toggleToolbar)

/**
 * Action to toggle "Zen Mode" (hide all UI except canvas).
 */
export const useToggleZenMode = () => useEditorUIStore((s) => s.toggleZenMode)

/**
 * Action to change the position of the main toolbar.
 */
export const useSetToolbarPosition = () => useEditorUIStore((s) => s.setToolbarPosition)

/**
 * ── Prefs State & Actions ────────────────────────────────────────────────────
 */

/**
 * Returns the current viewport state (zoom, offset).
 */
export const useViewport = () => useEditorPrefsStore((s) => s.viewport)

/**
 * Action to update the canvas zoom level.
 */
export const useSetZoom = () => useEditorPrefsStore((s) => s.setZoom)

/**
 * Action to update the canvas viewport offset (panning).
 */
export const useSetViewportOffset = () => useEditorPrefsStore((s) => s.setViewportOffset)

/**
 * Returns the user's saved color palette.
 */
export const usePalette = () => useEditorPrefsStore((s) => s.palette)

/**
 * Action to save a new color to the user's palette.
 */
export const useSaveColor = () => useEditorPrefsStore((s) => s.saveColor)

/**
 * Action to remove a color from the user's palette.
 */
export const useRemoveColor = () => useEditorPrefsStore((s) => s.removeColor)

/**
 * Returns whether the grid is currently visible.
 */
export const useShowGrid = () => useEditorPrefsStore((s) => s.showGrid)

/**
 * Returns whether onion skinning is currently enabled.
 */
export const useOnionSkinEnabled = () => useEditorPrefsStore((s) => s.onionSkinEnabled)

/**
 * Action to toggle the grid visibility.
 */
export const useSetShowGrid = () => useEditorPrefsStore((s) => s.setShowGrid)

/**
 * Action to toggle the onion skinning mode.
 */
export const useToggleOnionSkin = () => useEditorPrefsStore((s) => s.toggleOnionSkin)

/**
 * Returns the PixelLab API key stored in preferences.
 */
export const usePixelLabApiKey = () => useEditorPrefsStore((s) => s.pixellabApiKey)

/**
 * Action to update the PixelLab API key in preferences.
 */
export const useSetPixelLabApiKey = () => useEditorPrefsStore((s) => s.setPixelLabApiKey)
