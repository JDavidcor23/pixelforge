import type { ReactNode } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

import { useCollapsibleSection } from './useCollapsibleSection.hook'
import { FOCUS_RING } from '@/constants/focus-ring'

interface CollapsibleSectionProps {
  readonly title: string
  readonly children: ReactNode
  readonly defaultOpen?: boolean
  readonly icon?: ReactNode
}

export const CollapsibleSection = ({
  title,
  children,
  defaultOpen = true,
  icon,
}: CollapsibleSectionProps) => {
  const { isOpen, toggle } = useCollapsibleSection(defaultOpen)

  return (
    <section className="flex flex-col gap-2">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        className={`flex w-full items-center gap-1.5 text-left outline-none ${FOCUS_RING.SURFACE}`}
      >
        {icon && <span className="text-subtle">{icon}</span>}
        <span className="font-mono text-3xs uppercase tracking-wider text-subtle">{title}</span>
        <span className="flex-1" />
        {isOpen ? (
          <ChevronDown size={12} className="text-subtle" aria-hidden />
        ) : (
          <ChevronRight size={12} className="text-subtle" aria-hidden />
        )}
      </button>

      {isOpen && <div>{children}</div>}
    </section>
  )
}
