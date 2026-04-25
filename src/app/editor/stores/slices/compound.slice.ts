import type { StateCreator } from 'zustand'

import type { AnimationFrame, Layer, SpriteEditorStore } from '@/app/editor/types'
import { SPRITE_EDITOR_DEFAULTS, SPRITE_EDITOR_HISTORY } from '@/app/editor/constants'
import { createEmptyBuffer, createSnapshot } from '@/app/editor/lib'

import type { CompoundSlice } from '../types/slices'

/**
 * createCompoundSlice orchestrates high-level actions that span multiple state domains.
 * It handles history management, complex timeline operations, tool switching logic,
 * and integration with external features like the AI Copilot.
 */
export const createCompoundSlice: StateCreator<
  SpriteEditorStore,
  [['zustand/persist', unknown]],
  [],
  CompoundSlice
> = (set, get) => ({
  // ── History Orchestration ──────────────────────────────────────────────────

  /**
   * Pushes a new snapshot of the entire editor state to the history stack.
   * Handles history truncation and maximum capacity limits.
   * @param description A human-readable description of the action for the history UI.
   */
  pushHistory: (description) => {
    get().saveCurrentFrameSnapshot()

    set((state) => {
      const entry = createSnapshot(
        state.layers,
        state.activeLayerId,
        description,
        state.timeline.frames,
        state.timeline.currentFrameIndex
      )
      const truncated = state.history.slice(0, state.historyIndex + 1)
      const newHistory = [...truncated, entry]

      if (newHistory.length > SPRITE_EDITOR_HISTORY.MAX_ENTRIES) {
        newHistory.shift()
      }

      return {
        history: newHistory,
        historyIndex: newHistory.length - 1,
      }
    })
  },

  // ── Timeline Orchestration ─────────────────────────────────────────────────

  /**
   * Creates a new animation frame by initializing a blank layer stack.
   * Automatically saves the current frame state before switching.
   */
  addFrame: () => {
    get().saveCurrentFrameSnapshot()

    set((state) => {
      const newLayer: Layer = {
        id: crypto.randomUUID(),
        name: `${SPRITE_EDITOR_DEFAULTS.LAYER_NAME_PREFIX} 1`,
        visible: true,
        locked: false,
        opacity: 100,
        pixels: createEmptyBuffer(state.canvasWidth, state.canvasHeight),
      }

      const newFrame: AnimationFrame = {
        id: crypto.randomUUID(),
        layers: [newLayer],
        activeLayerId: newLayer.id,
        durationMs: Math.round(1000 / state.timeline.fps),
      }

      const newFrames = [...state.timeline.frames, newFrame]

      return {
        timeline: {
          ...state.timeline,
          frames: newFrames,
          currentFrameIndex: newFrames.length - 1,
        },
      }
    })

    get().restoreFrameSnapshot(get().timeline.currentFrameIndex)
    get().pushHistory('Add Frame')
  },

  /**
   * Removes an animation frame at the specified index.
   * Updates history and ensures the editor remains on a valid frame.
   */
  removeFrame: (index) => {
    const state = get()
    if (state.timeline.frames.length <= 1) return

    get().pushHistory('Remove Frame')

    set((s) => {
      const newFrames = s.timeline.frames.filter((_, i) => i !== index)
      const newCurrentIndex = Math.min(
        s.timeline.currentFrameIndex > index
          ? s.timeline.currentFrameIndex - 1
          : s.timeline.currentFrameIndex,
        newFrames.length - 1
      )

      const newSelected = s.timeline.selectedFrameIndices
        .filter((i) => i !== index)
        .map((i) => (i > index ? i - 1 : i))

      return {
        timeline: {
          ...s.timeline,
          frames: newFrames,
          currentFrameIndex: newCurrentIndex,
          selectedFrameIndices: newSelected.length > 0 ? newSelected : [newCurrentIndex],
        },
      }
    })

    get().restoreFrameSnapshot(get().timeline.currentFrameIndex)
  },

  /**
   * Switches the active animation frame.
   * Automatically commits any pending transformations before frame switching.
   */
  setCurrentFrame: (index) => {
    const state = get()

    if (state.selection?.floatingPixels) {
      state.commitTransformation()
    }

    state.saveCurrentFrameSnapshot()

    set((s) => ({
      timeline: {
        ...s.timeline,
        currentFrameIndex: index,
        selectedFrameIndices: [index],
      },
    }))

    get().restoreFrameSnapshot(index)
  },

  /**
   * Toggles the playback of the animation in the editor preview.
   */
  togglePlayback: () => {
    const state = get()
    if (!state.timeline.isPlaying) {
      state.saveCurrentFrameSnapshot()
    }
    set((s) => ({
      timeline: { ...s.timeline, isPlaying: !s.timeline.isPlaying },
    }))
  },

  /**
   * Moves the editor to the previous frame in the timeline.
   * Respects the looping setting.
   */
  goToPreviousFrame: () => {
    const state = get()
    const { currentFrameIndex, frames, loop } = state.timeline
    const total = frames.length
    if (total <= 1) return

    const nextIndex = loop
      ? (currentFrameIndex - 1 + total) % total
      : Math.max(0, currentFrameIndex - 1)

    if (nextIndex !== currentFrameIndex) {
      get().setCurrentFrame(nextIndex)
    }
  },

  /**
   * Moves the editor to the next frame in the timeline.
   * Respects the looping setting.
   */
  goToNextFrame: () => {
    const state = get()
    const { currentFrameIndex, frames, loop } = state.timeline
    const total = frames.length
    if (total <= 1) return

    const nextIndex = loop
      ? (currentFrameIndex + 1) % total
      : Math.min(total - 1, currentFrameIndex + 1)

    if (nextIndex !== currentFrameIndex) {
      get().setCurrentFrame(nextIndex)
    }
  },

  /**
   * Copies the currently selected frames into the frame clipboard.
   */
  copySelectedFrames: () => {
    const state = get()
    const { selectedFrameIndices } = state.timeline

    state.saveCurrentFrameSnapshot()

    const copied = get()
      .timeline.frames.filter((_, i) => selectedFrameIndices.includes(i))
      .map((frame) => ({ ...frame }))

    if (copied.length > 0) {
      set({ frameClipboard: copied })
    }
  },

  /**
   * Pastes frames from the frame clipboard after the current frame.
   */
  pasteFrames: () => {
    const state = get()
    if (!state.frameClipboard || state.frameClipboard.length === 0) return

    state.saveCurrentFrameSnapshot()

    const insertAfter = state.timeline.currentFrameIndex
    const newFrames = state.frameClipboard.map((frame) => ({
      ...frame,
      id: crypto.randomUUID(),
    }))

    set((s) => {
      const frames = [...s.timeline.frames]
      frames.splice(insertAfter + 1, 0, ...newFrames)

      const firstPastedIndex = insertAfter + 1
      const pastedIndices = newFrames.map((_, i) => firstPastedIndex + i)

      return {
        timeline: {
          ...s.timeline,
          frames,
          currentFrameIndex: firstPastedIndex,
          selectedFrameIndices: pastedIndices,
        },
      }
    })

    get().restoreFrameSnapshot(get().timeline.currentFrameIndex)
  },

  /**
   * Pastes frames from the frame clipboard at the end of the timeline.
   */
  pasteFramesAtEnd: () => {
    const state = get()
    if (!state.frameClipboard || state.frameClipboard.length === 0) return

    state.saveCurrentFrameSnapshot()

    const insertAt = state.timeline.frames.length
    const newFrames = state.frameClipboard.map((frame) => ({
      ...frame,
      id: crypto.randomUUID(),
    }))

    set((s) => {
      const frames = [...s.timeline.frames]
      frames.splice(insertAt, 0, ...newFrames)

      const firstPastedIndex = insertAt
      const pastedIndices = newFrames.map((_, i) => firstPastedIndex + i)

      return {
        timeline: {
          ...s.timeline,
          frames,
          currentFrameIndex: firstPastedIndex,
          selectedFrameIndices: pastedIndices,
        },
      }
    })

    get().restoreFrameSnapshot(get().timeline.currentFrameIndex)
  },

  // ── Tool Orchestration ─────────────────────────────────────────────────────

  /**
   * Switches the active tool and manages transition logic.
   * Handles automatic transformation commitments and selection clearing.
   */
  setActiveTool: (tool) => {
    const state = get()

    if (state.activeTool === 'transform' && tool !== 'transform' && state.selection) {
      state.commitTransformation()
    }

    if (state.activeTool === 'select' && tool !== 'select' && tool !== 'transform') {
      set({ selection: null })
    }

    if (tool === 'transform' && state.selection && !state.selection.floatingPixels) {
      setTimeout(() => get().floatSelection(), 0)
    }

    set({ activeTool: tool })
  },

  // ── Clipboard Orchestration ────────────────────────────────────────────────

  /**
   * Pastes pixel data from the clipboard onto the canvas.
   * Automatically switches to the transform tool for placement.
   */
  pasteClipboard: () => {
    const state = get()
    if (!state.clipboard) return

    const clipboardHeight = state.clipboard.length
    const clipboardWidth = state.clipboard[0].length

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

  // ── AI Copilot Orchestration ───────────────────────────────────────────────

  /**
   * Replaces the entire sprite with a new pixel buffer.
   * Primarily used when applying AI-generated sprites.
   * Resizes the canvas to match the new content.
   */
  overwriteWithPixels: (pixels) => {
    get().pushHistory('AI Copilot: Apply PixelLab Image')

    const newLayer: Layer = {
      id: crypto.randomUUID(),
      name: `${SPRITE_EDITOR_DEFAULTS.LAYER_NAME_PREFIX} 1`,
      visible: true,
      locked: false,
      opacity: 100,
      pixels,
    }

    const newFrame: AnimationFrame = {
      id: crypto.randomUUID(),
      layers: [newLayer],
      activeLayerId: newLayer.id,
      durationMs: Math.round(1000 / get().timeline.fps),
    }

    set((state) => ({
      canvasWidth: pixels[0].length,
      canvasHeight: pixels.length,
      layers: [newLayer],
      activeLayerId: newLayer.id,
      timeline: {
        ...state.timeline,
        frames: [newFrame],
        currentFrameIndex: 0,
        selectedFrameIndices: [0],
      },
      selection: null,
    }))
  },
})
