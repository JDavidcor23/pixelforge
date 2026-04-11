import { useShallow } from 'zustand/react/shallow'

import { useSpriteEditorStore } from '@/app/editor/stores'

// ── State Selectors ─────────────────────────────────────────────────

export const useLayers = () => useSpriteEditorStore((s) => s.layers)
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

// ── Sidebar Actions ─────────────────────────────────────────────────

export const useSetLeftSidebarTab = () =>
  useSpriteEditorStore((s) => s.setLeftSidebarTab)

