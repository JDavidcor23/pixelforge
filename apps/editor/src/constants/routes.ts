import { AudioLines, Brush } from 'lucide-react'

import type { EditorNavItem } from '@/types'

export const EDITOR_ROUTES = {
  SPRITES: '/sprites',
  SOUNDS: '/sounds',
  /** Full-screen, outside the editor shell (no app rail) — optional accounts, see `AuthSlice`. */
  LOGIN: '/login',
  RESET_PASSWORD: '/reset-password',
} as const

export const EDITOR_NAV_ITEMS: readonly EditorNavItem[] = [
  { href: EDITOR_ROUTES.SPRITES, label: 'Sprites', icon: Brush },
  { href: EDITOR_ROUTES.SOUNDS, label: 'Sounds', icon: AudioLines },
] as const

/** Legal pages live on the marketing site (`apps/landing`), linked from the login page footer. */
export const LANDING_ROUTES = {
  PRIVACY: '/privacy',
  TERMS: '/terms',
} as const
