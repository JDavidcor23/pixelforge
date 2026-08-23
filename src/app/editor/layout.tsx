'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Paintbrush, Music } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/editor/sprites', label: 'Sprites', icon: Paintbrush },
  { href: '/editor/sounds', label: 'Sounds', icon: Music },
] as const

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0f1115]">
      <nav
        className="flex w-14 flex-col items-center gap-2 border-r border-zinc-800 bg-zinc-900/50 py-3"
        aria-label="Editor navigation"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                isActive
                  ? 'bg-violet-600 text-white'
                  : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
              }`}
            >
              <Icon className="h-5 w-5" />
            </Link>
          )
        })}
      </nav>
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
