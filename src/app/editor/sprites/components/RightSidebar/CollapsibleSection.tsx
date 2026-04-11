'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface CollapsibleSectionProps {
  readonly title: string
  readonly children: React.ReactNode
  readonly defaultOpen?: boolean
  readonly icon?: React.ReactNode
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ 
  title, 
  children, 
  defaultOpen = true,
  icon
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <section className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="mb-2 flex w-full items-center justify-between group"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-medium uppercase tracking-wider text-[#8888aa] transition-colors group-hover:text-white">
            {title}
          </h3>
          {icon && <div className="text-[#8888aa]">{icon}</div>}
        </div>
        {isOpen ? (
          <ChevronDown size={14} className="text-[#8888aa]" />
        ) : (
          <ChevronRight size={14} className="text-[#8888aa]" />
        )}
      </button>
      
      {isOpen && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
          {children}
        </div>
      )}
    </section>
  )
}
