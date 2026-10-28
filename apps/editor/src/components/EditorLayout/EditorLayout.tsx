import { Link, Outlet } from 'react-router-dom'
import { Settings } from 'lucide-react'

import { SettingsPanel } from '../SettingsPanel/SettingsPanel'
import { AccountDeletedNotice } from './AccountDeletedNotice/AccountDeletedNotice'
import { DeleteAccountDialog } from '@/auth/components/DeleteAccountDialog/DeleteAccountDialog'
import { useEditorLayout } from './useEditorLayout.hook'
import { FOCUS_RING } from '@/constants/focus-ring'

const RAIL_ITEM = `flex size-9 items-center justify-center rounded text-muted hover:bg-hover aria-[current=page]:bg-hover aria-[current=page]:text-accent ${FOCUS_RING.SURFACE}`

export function EditorLayout() {
  const {
    navItems,
    isSettingsOpen,
    openSettings,
    closeSettings,
    isDeleteAccountDialogOpen,
    closeDeleteAccountDialog,
    isAccountDeletedNoticeVisible,
  } = useEditorLayout()

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-sunken text-ink">
      <nav
        className="flex w-14 shrink-0 flex-col items-center gap-2 border-r border-line bg-surface py-3"
        aria-label="Editor navigation"
      >
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            aria-label={item.label}
            title={item.label}
            aria-current={item.isActive ? 'page' : undefined}
            className={RAIL_ITEM}
          >
            <item.icon className="size-4.5" aria-hidden />
          </Link>
        ))}

        <button
          type="button"
          onClick={openSettings}
          aria-label="Settings"
          title="Settings"
          className={`mt-auto ${RAIL_ITEM}`}
        >
          <Settings className="size-4.5" aria-hidden />
        </button>
      </nav>

      <main className="min-w-0 flex-1 overflow-hidden">
        <Outlet />
      </main>

      {isSettingsOpen && <SettingsPanel onClose={closeSettings} />}
      {isDeleteAccountDialogOpen && <DeleteAccountDialog onClose={closeDeleteAccountDialog} />}
      {isAccountDeletedNoticeVisible && <AccountDeletedNotice />}
    </div>
  )
}
