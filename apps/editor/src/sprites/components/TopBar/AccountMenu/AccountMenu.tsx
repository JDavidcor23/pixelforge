import { LogOut, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useAccountMenu } from './useAccountMenu.hook'
import { EDITOR_ROUTES } from '@/constants/routes'
import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'
import { Z_INDEX } from '@/constants/z-index'

const DIVIDER = <div className="h-4 w-px shrink-0 bg-line-strong" />

const SIGN_IN_LINK = `rounded border border-line-strong px-2.5 py-1 text-xs text-muted hover:bg-hover hover:text-ink ${MOTION.COLORS} ${FOCUS_RING.SURFACE}`

const AVATAR_BUTTON = `flex size-7 items-center justify-center overflow-hidden rounded-full border border-line-strong text-2xs font-semibold text-muted hover:border-accent ${MOTION.COLORS} ${FOCUS_RING.SURFACE}`

const MENU_ITEM = `flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-ink hover:bg-hover ${MOTION.COLORS} ${FOCUS_RING.INSET}`

const MENU_ITEM_DANGER = `flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-danger hover:bg-hover ${MOTION.COLORS} ${FOCUS_RING.INSET}`

export const AccountMenu = () => {
  const {
    isAvailable,
    status,
    user,
    initial,
    isOpen,
    menuRef,
    triggerRef,
    toggle,
    handleSignOut,
    handleDeleteAccountClick,
  } = useAccountMenu()

  if (!isAvailable || status === 'loading') return null

  if (status === 'signed-out' || !user) {
    return (
      <>
        {DIVIDER}
        <Link to={EDITOR_ROUTES.LOGIN} className={SIGN_IN_LINK}>
          Sign in
        </Link>
      </>
    )
  }

  return (
    <>
      {DIVIDER}
      <div className="relative" ref={menuRef}>
        <button
          ref={triggerRef}
          type="button"
          onClick={toggle}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-label="Account menu"
          title={user.displayName ?? user.email ?? 'Account'}
          className={AVATAR_BUTTON}
        >
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="size-full object-cover" />
          ) : (
            <span aria-hidden>{initial}</span>
          )}
        </button>

        {isOpen && (
          <div
            role="menu"
            aria-label="Account"
            className={`absolute right-0 top-full ${Z_INDEX.POPOVER} mt-1 w-52 rounded border border-line-strong bg-raised py-1 shadow-popover ${MOTION.POPOVER_ENTER}`}
          >
            <div className="px-3 py-2">
              <p className="truncate text-xs font-medium text-ink">{user.displayName ?? 'Signed in'}</p>
              {user.email && <p className="truncate text-3xs text-subtle">{user.email}</p>}
            </div>
            <div className="my-1 h-px bg-line" />
            <button type="button" role="menuitem" onClick={handleSignOut} className={MENU_ITEM}>
              <LogOut size={13} aria-hidden />
              Sign out
            </button>
            <div className="my-1 h-px bg-line" />
            <button type="button" role="menuitem" onClick={handleDeleteAccountClick} className={MENU_ITEM_DANGER}>
              <Trash2 size={13} aria-hidden />
              Delete my account
            </button>
          </div>
        )}
      </div>
    </>
  )
}
