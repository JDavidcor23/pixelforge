import { AudioLines, Image, Pencil } from 'lucide-react'

import { BUILD_SCREEN_COPY } from '@/constants/build-screen'
import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'
import type { LibraryListRow } from '@/build/types'

const EDIT_BUTTON = `flex shrink-0 items-center gap-1 rounded px-2 py-1 text-2xs text-muted hover:bg-raised hover:text-accent ${MOTION.PRESS} ${FOCUS_RING.SURFACE}`

interface LibraryRowProps {
  row: LibraryListRow
}

export function LibraryRow({ row }: LibraryRowProps) {
  const KindIcon = row.kind === 'sprite' ? Image : AudioLines

  return (
    <li className={`group flex h-10 items-center gap-2.5 rounded-lg px-2.5 hover:bg-hover ${MOTION.COLORS}`}>
      <KindIcon className="size-3.5 shrink-0 text-subtle" aria-hidden />
      <span title={row.name} className="min-w-0 flex-1 truncate text-ui text-ink">
        {row.name}
      </span>
      <span className="shrink-0 text-2xs text-subtle">{row.kindLabel}</span>
      <button type="button" onClick={row.edit} aria-label={row.editAriaLabel} className={EDIT_BUTTON}>
        <Pencil className="size-3" aria-hidden />
        {BUILD_SCREEN_COPY.LIBRARY_EDIT}
      </button>
    </li>
  )
}
