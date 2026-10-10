import { Link, Outlet, useLocation } from 'react-router-dom'
import { Paintbrush, Music, Settings } from 'lucide-react'

import { SettingsPanel } from '../SettingsPanel/SettingsPanel'
import { EDITOR_ROUTES } from '@/constants/routes'
import { useEditorLayout } from './useEditorLayout.hook'

const NAV_ITEMS = [
  { href: EDITOR_ROUTES.SPRITES, label: 'Sprites', icon: Paintbrush },
  { href: EDITOR_ROUTES.SOUNDS, label: 'Sounds', icon: Music },
] as const

export function EditorLayout() {
  const location = useLocation()
  const { isSettingsOpen, openSettings, closeSettings } = useEditorLayout()

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0f1115]">
      <nav
        className="flex w-14 flex-col items-center border-r border-zinc-800 bg-zinc-900/50 py-3"
        aria-label="Editor navigation"
      >
        <div className="flex flex-col items-center gap-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                to={item.href}
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
        </div>

        {/* Spacer to push settings to bottom */}
        <div className="flex-1" />

        {/* Settings button */}
        <button
          onClick={openSettings}
          aria-label="Settings"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
        >
          <Settings className="h-5 w-5" />
        </button>
      </nav>

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>

      {isSettingsOpen && <SettingsPanel onClose={closeSettings} />}
    </div>
  )
}
