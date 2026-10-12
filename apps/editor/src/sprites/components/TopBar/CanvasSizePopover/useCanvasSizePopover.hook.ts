import { useCallback, useEffect, useRef, useState } from 'react'

import {
  useCanvasDimensions,
  useDispatch,
} from '@/sprites/hooks/useSpriteEditorStore.hook'
import { useSpriteEditorStore } from '@/stores'
import { isCanvasBlank } from '@/lib/canvas-blank'
import { CANVAS_SIZE_OPTIONS } from '@/constants'

const RESIZE_CONFIRM_MESSAGE =
  'Your drawing stays in the top-left corner. Anything outside the new size is cut. You can undo.'
const RESIZE_LABEL = 'Resize canvas'

/**
 * TopBar's canvas-size control (Sprite Studio v2 batch 4) — split out of
 * `useTopBar.hook.ts` so the top bar shell isn't also carrying this popover's
 * own open/pending/keyboard-nav state. Resizing goes through `dispatch` as a
 * SINGLE `doc.resize` command (ADR 0008), which is what makes the resize
 * undoable as one history entry instead of one per frame — and, unlike the
 * old `doc.replace`-based `buildResizeCommand`, preserves every layer (ids,
 * names, visibility, lock, opacity) instead of flattening them into one.
 */
export const useCanvasSizePopover = () => {
  const { width, height } = useCanvasDimensions()
  const dispatch = useDispatch()

  const [isOpen, setIsOpen] = useState(false)
  const [pendingSize, setPendingSize] = useState<number | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const label = `Canvas ${width} × ${height}`

  const close = useCallback((returnFocus = false) => {
    setIsOpen(false)
    setPendingSize(null)
    if (returnFocus) triggerRef.current?.focus()
  }, [])

  const toggle = useCallback(() => {
    setPendingSize(null)
    setIsOpen((open) => !open)
  }, [])

  const applyResize = useCallback(
    (size: number) => {
      dispatch({ type: 'doc.resize', canvasWidth: size, canvasHeight: size, label: RESIZE_LABEL })
      close()
    },
    [dispatch, close],
  )

  // Blank canvas (nothing drawn yet) resizes immediately — nothing to lose,
  // so the confirm step would be a dead click. Otherwise ask first. Reads
  // `timeline.frames` off `getState()` (not a subscription) — this hook only
  // needs the frames at the moment of the click, and subscribing to the
  // whole `timeline` would re-render the popover on every pixel while
  // drawing.
  const handleSelectSize = useCallback(
    (size: number) => {
      if (size === width && size === height) {
        close()
        return
      }
      if (isCanvasBlank(useSpriteEditorStore.getState().timeline.frames)) {
        applyResize(size)
        return
      }
      setPendingSize(size)
    },
    [width, height, applyResize, close],
  )

  const confirmResize = useCallback(() => {
    if (pendingSize !== null) applyResize(pendingSize)
  }, [pendingSize, applyResize])

  const cancelResize = useCallback(() => setPendingSize(null), [])

  // `doc.resize` preserves every layer (ADR 0008) — unlike the old
  // `doc.replace`-based flatten-to-one-layer resize, the confirm copy no
  // longer needs to warn about layers merging, so this is a plain constant.
  const confirmMessage = RESIZE_CONFIRM_MESSAGE

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        close()
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close(true)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, close])

  // Autofocus the first size option whenever the picker (re)opens.
  useEffect(() => {
    if (!isOpen || pendingSize !== null) return
    menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus()
  }, [isOpen, pendingSize])

  // Arrow-key roving focus across the size options (Escape/outside-click
  // close is handled by the effect above, same as the Export menu).
  const handleMenuKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (pendingSize !== null) return
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
      event.preventDefault()
      const items = menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')
      if (!items || items.length === 0) return
      const itemsArr = Array.from(items)
      const currentIndex = itemsArr.findIndex((el) => el === document.activeElement)
      const delta = event.key === 'ArrowDown' ? 1 : -1
      const nextIndex = (currentIndex + delta + itemsArr.length) % itemsArr.length
      itemsArr[nextIndex]?.focus()
    },
    [pendingSize],
  )

  return {
    width,
    height,
    label,
    sizeOptions: CANVAS_SIZE_OPTIONS,
    isOpen,
    menuRef,
    triggerRef,
    toggle,
    handleSelectSize,
    handleMenuKeyDown,
    pendingSize,
    confirmResize,
    cancelResize,
    confirmMessage,
  }
}
