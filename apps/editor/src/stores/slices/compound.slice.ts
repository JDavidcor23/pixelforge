import type { StateCreator } from 'zustand'

import type { SpriteEditorStore } from '@/types'
import { cloneBuffer } from '@/lib'
import { frameToSerializedFrame } from '@/lib/core/serialize'

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
  lastAIReferenceBase64: null,
  setLastAIReferenceBase64: (base64) => set({ lastAIReferenceBase64: base64 }),

  // ── Timeline Orchestration ─────────────────────────────────────────────────

  /**
   * Creates a new animation frame by initializing a blank layer stack.
   * Routed through `dispatch` (phase 2) — one `frame.add` command is one
   * undo-stack entry, replacing the old manual
   * saveCurrentFrameSnapshot + mutate + restoreFrameSnapshot + pushHistory
   * sequence (now inlined inside `lib/core/ts-core.ts`'s `frame.add` case).
   */
  addFrame: () => {
    // Bug #3: frame CRUD commits (or cancels) any floating selection into
    // its SOURCE layer/frame first — see `selection.slice.ts`'s
    // `commitTransformation` doc.
    if (get().selection?.floatingPixels) get().commitTransformation()
    get().dispatch({ type: 'frame.add' })
  },

  /**
   * Removes an animation frame at the specified index. Routed through
   * `dispatch` — see `addFrame` above.
   */
  removeFrame: (index) => {
    if (get().selection?.floatingPixels) get().commitTransformation()
    get().dispatch({ type: 'frame.remove', index })
  },

  /**
   * Switches the active animation frame. Routed through
   * `dispatch({type:'frame.select'})` (phase 2b, design D3) — since
   * `timeline.frames[i].layers` is the single source of truth for every
   * frame's pixels (no more parallel `state.layers` copy), switching frames
   * is nothing more than pointing `currentFrameIndex` at a different frame;
   * there is no snapshot to save or restore.
   * Automatically commits any pending transformations before frame switching.
   */
  setCurrentFrame: (index) => {
    const state = get()

    if (state.selection?.floatingPixels) {
      state.commitTransformation()
    }

    get().dispatch({ type: 'frame.select', index })
  },

  /**
   * Toggles the playback of the animation in the editor preview. Routed
   * through `dispatch({type:'timeline.togglePlayback'})` (phase 2c) instead
   * of a direct `set({timeline})` — `isPlaying` is playback/view state, not
   * a document edit, but core is still its single writer.
   */
  togglePlayback: () => {
    get().dispatch({ type: 'timeline.togglePlayback' })
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
   * `timeline.frames` is always live (single source of truth, design D3),
   * so no snapshot is needed before reading it.
   *
   * Judgment-day round 2 (finding 6): deep-copies with fresh frame AND
   * layer ids and cloned pixel buffers — the clipboard must never hold
   * live references into the document (defense in depth: `frame.paste`'s
   * own deep copy in `lib/core/ts-core.ts` is the authoritative fix, this
   * is belt-and-suspenders for anything that reads `frameClipboard`
   * directly without going through `dispatch`).
   */
  copySelectedFrames: () => {
    const state = get()
    const { selectedFrameIndices } = state.timeline

    const copied = state.timeline.frames
      .filter((_, i) => selectedFrameIndices.includes(i))
      .map((frame) => {
        const layerIdMap = new Map<string, string>()
        const layers = frame.layers.map((l) => {
          const id = crypto.randomUUID()
          layerIdMap.set(l.id, id)
          return { ...l, id, pixels: cloneBuffer(l.pixels) }
        })
        const activeLayerId = layerIdMap.get(frame.activeLayerId) ?? layers[0]?.id ?? frame.activeLayerId
        return { ...frame, id: crypto.randomUUID(), layers, activeLayerId }
      })

    if (copied.length > 0) {
      set({ frameClipboard: copied })
    }
  },

  /**
   * Pastes frames from the frame clipboard after the current frame. Routed
   * through `dispatch({type:'frame.paste'})` (phase 2b, design D3).
   *
   * Judgment-day round 2 (finding 6): the core's `frame.paste` command now
   * deep-copies every pasted frame itself (fresh frame AND layer ids, fresh
   * cloned pixel buffers — see `lib/core/ts-core.ts`'s
   * `serializedFrameToFrame`), so this slice no longer needs to (and must
   * not — pasting the SAME clipboard twice used to hand the core two frames
   * aliasing the exact same mutable layer/buffer objects).
   *
   * Phase 2e: the command payload itself is now plain, structured-clone-safe
   * data (`SerializedFrame[]`, not live `AnimationFrame[]`) — `frameToSerializedFrame`
   * copies each layer's pixel bytes into a fresh `Uint8Array` before the
   * clipboard's own buffers ever reach `dispatch`.
   */
  pasteFrames: () => {
    const state = get()
    if (!state.frameClipboard || state.frameClipboard.length === 0) return
    if (state.selection?.floatingPixels) get().commitTransformation() // Bug #3

    const insertAfter = state.timeline.currentFrameIndex
    get().dispatch({ type: 'frame.paste', at: insertAfter + 1, frames: state.frameClipboard.map(frameToSerializedFrame) })
  },

  /**
   * Pastes frames from the frame clipboard at the end of the timeline.
   * Routed through `dispatch({type:'frame.paste'})` — see `pasteFrames`.
   */
  pasteFramesAtEnd: () => {
    const state = get()
    if (!state.frameClipboard || state.frameClipboard.length === 0) return
    if (state.selection?.floatingPixels) get().commitTransformation() // Bug #3

    const insertAt = state.timeline.frames.length
    get().dispatch({ type: 'frame.paste', at: insertAt, frames: state.frameClipboard.map(frameToSerializedFrame) })
  },

  // ── Tool Orchestration ─────────────────────────────────────────────────────

  /**
   * Switches the active tool and manages transition logic.
   * Handles automatic transformation commitments and selection clearing.
   *
   * Phase 2c (judgment-day fixes): "tool switch ends any open stroke" —
   * `dispatch({type:'stroke.end'})` is a safe no-op when nothing is
   * currently being drawn (`lib/core/ts-core.ts`'s `stroke.end` case
   * returns `noChange` if `strokeState` is null), so this is always safe
   * to call unconditionally before switching tools.
   */
  setActiveTool: (tool) => {
    get().dispatch({ type: 'stroke.end', label: 'Draw' })

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

    const clipboardWidth = state.clipboard.w
    const clipboardHeight = state.clipboard.h

    if (state.activeTool === 'transform' && state.selection?.floatingPixels) {
      state.commitTransformation()
    }

    set({
      selection: {
        rect: { x: 0, y: 0, width: clipboardWidth, height: clipboardHeight },
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        floatingPixels: cloneBuffer(state.clipboard),
        originalArea: null,
      },
      activeTool: 'transform',
    })
  },

  // ── AI Copilot Orchestration ───────────────────────────────────────────────

  /**
   * Replaces the entire sprite with a new pixel buffer. Primarily used when
   * applying AI-generated sprites. Resizes the canvas to match the new
   * content. Routed through `dispatch({type:'doc.replace'})` (phase 2) — one
   * command, one undo-stack entry, same as the old full-snapshot
   * `pushHistory` call it replaces.
   */
  overwriteWithPixels: (pixels, referenceBase64) => {
    if (get().selection?.floatingPixels) get().commitTransformation() // Bug #3

    const prevWidth = get().canvasWidth
    const prevHeight = get().canvasHeight

    get().dispatch({
      type: 'doc.replace',
      canvasWidth: pixels.w,
      canvasHeight: pixels.h,
      frames: [{ pixels }],
      frameDurationMs: Math.round(1000 / get().timeline.fps),
      label: 'AI Copilot: Apply Generated Image',
    })

    // Bug #2 decision: the frame clipboard holds buffers sized for the OLD
    // canvas. Once the canvas is resized, `frame.paste`'s new size
    // validation would silently reject every future paste from it — clear
    // it instead of leaving a clipboard the user can never paste again.
    const sizeChanged = get().canvasWidth !== prevWidth || get().canvasHeight !== prevHeight

    set((state) => ({
      selection: null,
      lastAIReferenceBase64: referenceBase64 ?? state.lastAIReferenceBase64,
      ...(sizeChanged ? { frameClipboard: null } : {}),
    }))
  },

  /**
   * Imports an AI-generated animation as multiple timeline frames. Each
   * PixelBuffer becomes a single-layer frame in the timeline. Replaces the
   * current timeline entirely. Routed through `dispatch` — see
   * `overwriteWithPixels` above.
   */
  importAnimationFrames: (pixelFrames, frameDurationMs) => {
    if (pixelFrames.length === 0) return
    if (get().selection?.floatingPixels) get().commitTransformation() // Bug #3

    const prevWidth = get().canvasWidth
    const prevHeight = get().canvasHeight

    get().dispatch({
      type: 'doc.replace',
      canvasWidth: pixelFrames[0].w,
      canvasHeight: pixelFrames[0].h,
      frames: pixelFrames.map((pixels) => ({ pixels })),
      frameDurationMs,
      label: 'AI Copilot: Import Animation',
    })

    // Bug #2 decision: see `overwriteWithPixels` above.
    const sizeChanged = get().canvasWidth !== prevWidth || get().canvasHeight !== prevHeight
    set({ selection: null, ...(sizeChanged ? { frameClipboard: null } : {}) })
  },
})

