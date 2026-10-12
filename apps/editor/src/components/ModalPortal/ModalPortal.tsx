import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

interface ModalPortalProps {
  readonly children: ReactNode
}

/**
 * Renders modal content straight onto `document.body`, outside the editor
 * shell's own DOM subtree — and therefore outside any ancestor that could
 * ever become a stacking context an in-layout `z-index` might outrank (see
 * `Z_INDEX.MODAL`). React's synthetic event bubbling still follows the
 * React tree, not the DOM tree, so backdrop `onClick`/`onKeyDown` handlers
 * keep working exactly as if this were rendered in place.
 */
export function ModalPortal({ children }: ModalPortalProps) {
  return createPortal(children, document.body)
}
