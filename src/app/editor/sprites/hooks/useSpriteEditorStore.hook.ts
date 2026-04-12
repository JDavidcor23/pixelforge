import { useShallow } from 'zustand/react/shallow'

import { useSpriteEditorStore } from '@/app/editor/stores'

// ── State Selectors ─────────────────────────────────────────────────

export const useLayers = () => useSpriteEditorStore((s) => s.layers)
// Selectors strictly for UI components to avoid re-rendering on pixel updates
export const useActiveLayerOpacity = () =>
  useSpriteEditorStore(
    (s) => s.layers.find((l) => l.id === s.activeLayerId)?.opacity ?? 100
  )
export const useLayersMetadata = () => {
  // We stringify the metadata to perform a deep equality check on primitives
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
export const useActiveLayerId = () => useSpriteEditorStore((s) => s.activeLayerId)
export const useActiveTool = () => useSpriteEditorStore((s) => s.activeTool)
export const usePrimaryColor = () => useSpriteEditorStore((s) => s.primaryColor)
export const useSecondaryColor = () => useSpriteEditorStore((s) => s.secondaryColor)
export const useViewport = () => useSpriteEditorStore((s) => s.viewport)
export const useCursorPixel = () => useSpriteEditorStore((s) => s.cursorPixel)
export const useTimeline = () => useSpriteEditorStore((s) => s.timeline)
export const useLeftSidebarTab = () => useSpriteEditorStore((s) => s.leftSidebarTab)
export const useHistoryIndex = () => useSpriteEditorStore((s) => s.historyIndex)
export const useHistoryLength = () => useSpriteEditorStore((s) => s.history.length)
export const useSelection = () => useSpriteEditorStore((s) => s.selection)

export const useCanvasDimensions = () =>
  useSpriteEditorStore(
    useShallow((s) => ({ width: s.canvasWidth, height: s.canvasHeight }))
  )

// ── Pixel Actions ───────────────────────────────────────────────────

export const useSetPixel = () => useSpriteEditorStore((s) => s.setPixel)
export const useSetPixelBatch = () => useSpriteEditorStore((s) => s.setPixelBatch)
export const useFloodFill = () => useSpriteEditorStore((s) => s.floodFill)
export const useClearLayer = () => useSpriteEditorStore((s) => s.clearLayer)

// ── Layer Actions ───────────────────────────────────────────────────

export const useAddLayer = () => useSpriteEditorStore((s) => s.addLayer)
export const useRemoveLayer = () => useSpriteEditorStore((s) => s.removeLayer)
export const useToggleLayerVisibility = () =>
  useSpriteEditorStore((s) => s.toggleLayerVisibility)
export const useToggleLayerLock = () => useSpriteEditorStore((s) => s.toggleLayerLock)
export const useSetLayerOpacity = () => useSpriteEditorStore((s) => s.setLayerOpacity)
export const useReorderLayers = () => useSpriteEditorStore((s) => s.reorderLayers)
export const useSetActiveLayer = () => useSpriteEditorStore((s) => s.setActiveLayer)
export const useUpdateLayerName = () => useSpriteEditorStore((s) => s.updateLayerName)

// ── Tool Actions ────────────────────────────────────────────────────

export const useSetActiveTool = () => useSpriteEditorStore((s) => s.setActiveTool)
export const useSetPrimaryColor = () => useSpriteEditorStore((s) => s.setPrimaryColor)
export const useSetSecondaryColor = () =>
  useSpriteEditorStore((s) => s.setSecondaryColor)
export const useSetCursorPixel = () => useSpriteEditorStore((s) => s.setCursorPixel)

// ── Viewport Actions ────────────────────────────────────────────────

export const useSetZoom = () => useSpriteEditorStore((s) => s.setZoom)
export const useSetViewportOffset = () =>
  useSpriteEditorStore((s) => s.setViewportOffset)

// ── History Actions ─────────────────────────────────────────────────

export const usePushHistory = () => useSpriteEditorStore((s) => s.pushHistory)
export const useUndo = () => useSpriteEditorStore((s) => s.undo)
export const useRedo = () => useSpriteEditorStore((s) => s.redo)

// ── Timeline Actions ────────────────────────────────────────────────

export const useAddFrame = () => useSpriteEditorStore((s) => s.addFrame)
export const useRemoveFrame = () => useSpriteEditorStore((s) => s.removeFrame)
export const useSetCurrentFrame = () => useSpriteEditorStore((s) => s.setCurrentFrame)
export const useSetFps = () => useSpriteEditorStore((s) => s.setFps)
export const useTogglePlayback = () => useSpriteEditorStore((s) => s.togglePlayback)
export const useToggleLoop = () => useSpriteEditorStore((s) => s.toggleLoop)
export const useGoToPreviousFrame = () => useSpriteEditorStore((s) => s.goToPreviousFrame)
export const useGoToNextFrame = () => useSpriteEditorStore((s) => s.goToNextFrame)
export const useSetFrameSelection = () => useSpriteEditorStore((s) => s.setFrameSelection)
export const useCopySelectedFrames = () => useSpriteEditorStore((s) => s.copySelectedFrames)
export const usePasteFrames = () => useSpriteEditorStore((s) => s.pasteFrames)
export const usePasteFramesAtEnd = () => useSpriteEditorStore((s) => s.pasteFramesAtEnd)
export const useFrameClipboard = () => useSpriteEditorStore((s) => s.frameClipboard)

// ── Sidebar Actions ─────────────────────────────────────────────────

export const useSetLeftSidebarTab = () =>
  useSpriteEditorStore((s) => s.setLeftSidebarTab)

export const useSetSelection = () => useSpriteEditorStore((s) => s.setSelection)
export const useFloatSelection = () => useSpriteEditorStore((s) => s.floatSelection)
export const useSetSelectionTransform = () => useSpriteEditorStore((s) => s.setSelectionTransform)
export const useCommitTransformation = () =>
  useSpriteEditorStore((s) => s.commitTransformation)

// ── Palette Actions ──────────────────────────────────────────────────

export const usePalette = () => useSpriteEditorStore((s) => s.palette)
export const useSaveColor = () => useSpriteEditorStore((s) => s.saveColor)
export const useRemoveColor = () => useSpriteEditorStore((s) => s.removeColor)

// ── View Preferences ─────────────────────────────────────────────────

export const useShowGrid = () => useSpriteEditorStore((s) => s.showGrid)
export const useOnionSkinEnabled = () => useSpriteEditorStore((s) => s.onionSkinEnabled)
export const useSetShowGrid = () => useSpriteEditorStore((s) => s.setShowGrid)
export const useToggleOnionSkin = () => useSpriteEditorStore((s) => s.toggleOnionSkin)

// ── Clipboard Actions ────────────────────────────────────────────────

export const useClipboard = () => useSpriteEditorStore((s) => s.clipboard)
export const useCopySelection = () => useSpriteEditorStore((s) => s.copySelection)
export const useCutSelection = () => useSpriteEditorStore((s) => s.cutSelection)
export const usePasteClipboard = () => useSpriteEditorStore((s) => s.pasteClipboard)
export const useDeleteSelection = () => useSpriteEditorStore((s) => s.deleteSelection)

// ── UI Selectors & Actions ───────────────────────────────────────────

export const useUIState = () => useSpriteEditorStore((s) => s.ui)
export const useToggleLeftSidebar = () => useSpriteEditorStore((s) => s.toggleLeftSidebar)
export const useToggleRightSidebar = () => useSpriteEditorStore((s) => s.toggleRightSidebar)
export const useToggleTimeline = () => useSpriteEditorStore((s) => s.toggleTimeline)
export const useToggleToolbar = () => useSpriteEditorStore((s) => s.toggleToolbar)
export const useToggleZenMode = () => useSpriteEditorStore((s) => s.toggleZenMode)
export const useSetToolbarPosition = () => useSpriteEditorStore((s) => s.setToolbarPosition)

