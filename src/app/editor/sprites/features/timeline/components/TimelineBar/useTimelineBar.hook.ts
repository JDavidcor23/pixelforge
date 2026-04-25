'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { SPRITE_EDITOR_TIMELINE } from '@/app/editor/constants'
import {
  useTimeline,
  useAddFrame,
  useRemoveFrame,
  useSetCurrentFrame,
  useSetFps,
  useTogglePlayback,
  useToggleLoop,
  useGoToPreviousFrame,
  useGoToNextFrame,
  useSetFrameSelection,
  useCopySelectedFrames,
  usePasteFrames,
  usePasteFramesAtEnd,
  useFrameClipboard,
  useSelection,
} from '@/app/editor/sprites/hooks/useSpriteEditorStore.hook'
import { useAnimationPlayback } from '../../hooks/useAnimationPlayback.hook'

// ── Helper: find which frame index (by data-frame-index) the pointer is over ──
function getFrameAtClientX(
  strip: HTMLDivElement,
  clientX: number
): number {
  const thumbnails = strip.querySelectorAll<HTMLElement>('[data-frame-index]')
  for (const el of thumbnails) {
    const bcr = el.getBoundingClientRect()
    if (clientX >= bcr.left && clientX <= bcr.right) {
      return parseInt(el.getAttribute('data-frame-index') ?? '-1', 10)
    }
  }
  return -1
}

// ── Helper: find all frame indices whose bounds intersect with [left, right] in
//    viewport coords
function getFramesInViewportRange(
  strip: HTMLDivElement,
  left: number,
  right: number
): number[] {
  const thumbnails = strip.querySelectorAll<HTMLElement>('[data-frame-index]')
  const result: number[] = []
  for (const el of thumbnails) {
    const bcr = el.getBoundingClientRect()
    if (bcr.right > left && bcr.left < right) {
      const idx = parseInt(el.getAttribute('data-frame-index') ?? '-1', 10)
      if (idx >= 0) result.push(idx)
    }
  }
  return result
}

export const useTimelineBar = () => {
  const timeline = useTimeline()
  const addFrame = useAddFrame()
  const removeFrame = useRemoveFrame()
  const setCurrentFrame = useSetCurrentFrame()
  const setFps = useSetFps()
  const togglePlayback = useTogglePlayback()
  const toggleLoop = useToggleLoop()
  const goToPreviousFrame = useGoToPreviousFrame()
  const goToNextFrame = useGoToNextFrame()
  const setFrameSelection = useSetFrameSelection()
  const copySelectedFrames = useCopySelectedFrames()
  const pasteFrames = usePasteFrames()
  const pasteFramesAtEnd = usePasteFramesAtEnd()
  const frameClipboard = useFrameClipboard()
  const pixelSelection = useSelection()

  useAnimationPlayback()

  // ── Strip ref (for rubber band positioning + hit testing) ──────────
  const stripRef = useRef<HTMLDivElement>(null)

  // ── Drag state refs (no re-renders needed) ─────────────────────────
  const isDraggingRef = useRef(false)
  const hasDraggedRef = useRef(false)
  const dragStartClientXRef = useRef(0) // viewport X where drag started
  const dragStartRelXRef = useRef(0)    // strip-scroll-adjusted X where drag started
  const clickedFrameIndexRef = useRef(-1) // frame under cursor at pointerDown

  // Rubber band rect — state so it triggers re-renders for the overlay
  const [dragRect, setDragRect] = useState<{ left: number; width: number } | null>(null)

  // ── Ref for current selectedFrameIndices (avoids stale closure in pointerUp) ─
  const selectedFrameIndicesRef = useRef<number[]>(timeline.selectedFrameIndices)
  useEffect(() => {
    selectedFrameIndicesRef.current = timeline.selectedFrameIndices
  }, [timeline.selectedFrameIndices])

  // ── Ref for pixelSelection (keyboard shortcut disambiguation) ─────
  const pixelSelectionRef = useRef(pixelSelection)
  useEffect(() => { pixelSelectionRef.current = pixelSelection }, [pixelSelection])

  // ── Keyboard: Ctrl+C / Ctrl+V for frames ──────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept shortcuts if the user is typing in an input field
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      if (!(e.ctrlKey || e.metaKey)) return
      if (pixelSelectionRef.current !== null) return // pixel clipboard has priority

      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault()
        copySelectedFrames()
      } else if (e.key === 'v' || e.key === 'V') {
        e.preventDefault()
        pasteFramesAtEnd()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [copySelectedFrames, pasteFrames])

  // ── Global pointerup — safety net to end drag ──────────────────────
  useEffect(() => {
    const onPointerUp = () => {
      isDraggingRef.current = false
      hasDraggedRef.current = false
      dragStartClientXRef.current = 0
      clickedFrameIndexRef.current = -1
      setDragRect(null)
    }
    window.addEventListener('pointerup', onPointerUp)
    return () => window.removeEventListener('pointerup', onPointerUp)
  }, [])

  // ── Strip-level pointer handlers (primary interaction layer) ───────

  const handleStripPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return // left click only

    // Don't start drag if clicking the delete button
    if ((e.target as HTMLElement).closest('[data-is-delete-btn]')) return

    isDraggingRef.current = true
    hasDraggedRef.current = false
    dragStartClientXRef.current = e.clientX

    if (stripRef.current) {
      const bcr = stripRef.current.getBoundingClientRect()
      const relX = e.clientX - bcr.left + stripRef.current.scrollLeft
      dragStartRelXRef.current = relX
      setDragRect({ left: relX, width: 0 })

      // Record which frame was under cursor at click (for plain-click activation)
      clickedFrameIndexRef.current = getFrameAtClientX(stripRef.current, e.clientX)
    }
  }, [])

  const handleStripPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current || !stripRef.current) return

      const bcr = stripRef.current.getBoundingClientRect()
      const scrollLeft = stripRef.current.scrollLeft

      // Compute rubber band in strip-content coordinates
      const startRelX = dragStartRelXRef.current
      const currentRelX = e.clientX - bcr.left + scrollLeft

      const left = Math.max(0, Math.min(startRelX, currentRelX))
      const right = Math.max(startRelX, currentRelX)
      setDragRect({ left, width: right - left })

      if (right - left < 4) return // ignore tiny movements

      hasDraggedRef.current = true

      // Convert rubber band back to viewport coords for hit testing
      const viewportLeft = bcr.left + left - scrollLeft
      const viewportRight = bcr.left + right - scrollLeft
      const intersecting = getFramesInViewportRange(stripRef.current, viewportLeft, viewportRight)

      if (intersecting.length > 0) {
        setFrameSelection(intersecting)
      }
    },
    [setFrameSelection]
  )

  const handleStripPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current) return

      if (!hasDraggedRef.current) {
        // Plain click (no drag) — activate the clicked frame
        const clickedIndex = clickedFrameIndexRef.current

        if (clickedIndex >= 0) {
          const isCtrl = e.ctrlKey || e.metaKey
          const isShift = e.shiftKey
          const currentSelection = selectedFrameIndicesRef.current

          if (isShift) {
            // Range selection: from currentFrameIndex (anchor) to clickedIndex
            const start = Math.min(timeline.currentFrameIndex, clickedIndex)
            const end = Math.max(timeline.currentFrameIndex, clickedIndex)
            const range = Array.from({ length: end - start + 1 }, (_, i) => start + i)
            setFrameSelection(range)
          } else if (isCtrl) {
            // Toggle selection: add or remove from current selection
            const isAlreadySelected = currentSelection.includes(clickedIndex)
            const nextSelection = isAlreadySelected
              ? currentSelection.filter((i) => i !== clickedIndex)
              : [...currentSelection, clickedIndex]

            // We must always have at least one frame in selection context if possible
            if (nextSelection.length > 0) {
              setFrameSelection(nextSelection)
              // If we add a new one via Ctrl, it becomes the new active anchor
              if (!isAlreadySelected) {
                setCurrentFrame(clickedIndex)
              }
            }
          } else {
            // Regular click: reset selection to single frame and make it active
            setCurrentFrame(clickedIndex)
            setFrameSelection([clickedIndex])
          }
        }
      }

      isDraggingRef.current = false
      hasDraggedRef.current = false
      clickedFrameIndexRef.current = -1
      setDragRect(null)
    },
    [setCurrentFrame, setFrameSelection]
  )

  // ── Standard handlers ─────────────────────────────────────────────

  const handleFpsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value)
      const clamped = Math.min(
        SPRITE_EDITOR_TIMELINE.MAX_FPS,
        Math.max(SPRITE_EDITOR_TIMELINE.MIN_FPS, value)
      )
      setFps(clamped)
    },
    [setFps]
  )

  const handleAddFrame = useCallback(() => addFrame(), [addFrame])
  const handleRemoveFrame = useCallback((index: number) => removeFrame(index), [removeFrame])
  const handleTogglePlayback = useCallback(() => togglePlayback(), [togglePlayback])
  const handleToggleLoop = useCallback(() => toggleLoop(), [toggleLoop])
  const handlePreviousFrame = useCallback(() => goToPreviousFrame(), [goToPreviousFrame])
  const handleNextFrame = useCallback(() => goToNextFrame(), [goToNextFrame])
  const handleCopyFrames = useCallback(() => copySelectedFrames(), [copySelectedFrames])
  const handlePasteFrames = useCallback(() => pasteFrames(), [pasteFrames])
  const handlePasteFramesAtEnd = useCallback(() => pasteFramesAtEnd(), [pasteFramesAtEnd])

  return {
    timeline,
    frameClipboard,
    stripRef,
    dragRect,
    handleFpsChange,
    handleAddFrame,
    handleRemoveFrame,
    handleStripPointerDown,
    handleStripPointerMove,
    handleStripPointerUp,
    handleTogglePlayback,
    handleToggleLoop,
    handlePreviousFrame,
    handleNextFrame,
    handleCopyFrames,
    handlePasteFrames,
    handlePasteFramesAtEnd,
  }
}
