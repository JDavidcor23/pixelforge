import type { BuildPanelTabItem, LibraryFilter, LibraryFilterItem } from '@/build/types'

/** Build screen (`/build`, ADR 0014) — layout of design frame `opmIw`. */
export const BUILD_PANEL_TABS = {
  CHAT: 'chat',
  LIBRARY: 'library',
} as const

export const BUILD_PANEL_TAB_ITEMS: readonly BuildPanelTabItem[] = [
  { id: BUILD_PANEL_TABS.CHAT, label: 'Chat' },
  { id: BUILD_PANEL_TABS.LIBRARY, label: 'Biblioteca' },
] as const

export const LIBRARY_FILTERS = {
  ALL: 'all',
  SPRITES: 'sprites',
  AUDIO: 'audio',
  MUSIC: 'music',
  VIDEO: 'video',
} as const

export const LIBRARY_FILTER_ITEMS: readonly LibraryFilterItem[] = [
  { id: LIBRARY_FILTERS.ALL, label: 'Todos' },
  { id: LIBRARY_FILTERS.SPRITES, label: 'Sprites' },
  { id: LIBRARY_FILTERS.AUDIO, label: 'Audio' },
  { id: LIBRARY_FILTERS.MUSIC, label: 'Música' },
  { id: LIBRARY_FILTERS.VIDEO, label: 'Video' },
] as const

/** Phase 1 has no filtering: the chip row is static with this one active. */
export const LIBRARY_ACTIVE_FILTER: LibraryFilter = LIBRARY_FILTERS.ALL

export const BUILD_SCREEN_COPY = {
  PANEL_TABS_LABEL: 'Panel de construcción',
  CHAT_EMPTY_TITLE: 'Todavía no hay mensajes',
  CHAT_EMPTY_HINT: 'Describe tu juego para empezar.',
  CHAT_INPUT_PLACEHOLDER: 'Describe el siguiente momento de la historia…',
  CHAT_SEND: 'Enviar',
  LIBRARY_SEARCH_PLACEHOLDER: 'Buscar sprite, audio, música…',
  LIBRARY_EMPTY_TITLE: 'La biblioteca está vacía',
  LIBRARY_EMPTY_HINT: 'Los sprites y sonidos que crees aparecerán aquí.',
  PREVIEW_LIVE: 'En vivo',
  PREVIEW_RESTART: 'Reiniciar',
  PREVIEW_PAUSE: 'Pausar',
  PREVIEW_RESUME: 'Reanudar',
  PREVIEW_FULLSCREEN: 'Pantalla completa',
} as const
