import { AudioLines, Brush } from 'lucide-react'

import type { EditorNavItem } from '@/types'

export const EDITOR_ROUTES = {
  SPRITES: '/sprites',
  SOUNDS: '/sounds',
} as const

export const EDITOR_NAV_ITEMS: readonly EditorNavItem[] = [
  { href: EDITOR_ROUTES.SPRITES, label: 'Sprites', icon: Brush },
  { href: EDITOR_ROUTES.SOUNDS, label: 'Sounds', icon: AudioLines },
] as const
