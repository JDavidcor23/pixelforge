import { Mic, Music, Zap } from 'lucide-react'

import type { AudioAssetTag } from '@/types/audio'
import type { TrackColorClasses, TrackKindOption } from '@/types/timeline-view'
import { DEFAULT_TRACK_KINDS, DEFAULT_TRACK_NAMES } from './timeline'

// Full literal class strings so Tailwind sees them statically. Colors come from
// the `--pf-track-*` tokens (Voice is amber: violet is reserved for AI).
// `not-data-selected:hover:` avoids the hover/selected variant-order race in v4.

export const TRACK_COLOR = {
  sfx: {
    ICON: 'text-track-sfx',
    CLIP: 'bg-track-sfx/8 border-track-sfx/35 not-data-selected:hover:bg-track-sfx/12 not-data-selected:hover:border-track-sfx/50 data-selected:bg-track-sfx/15',
    WAVE: 'fill-track-sfx/60 group-data-selected:fill-track-sfx/90',
    GHOST: 'bg-track-sfx/8 border-track-sfx',
  },
  music: {
    ICON: 'text-track-music',
    CLIP: 'bg-track-music/8 border-track-music/35 not-data-selected:hover:bg-track-music/12 not-data-selected:hover:border-track-music/50 data-selected:bg-track-music/15',
    WAVE: 'fill-track-music/60 group-data-selected:fill-track-music/90',
    GHOST: 'bg-track-music/8 border-track-music',
  },
  dialog: {
    ICON: 'text-track-voice',
    CLIP: 'bg-track-voice/8 border-track-voice/35 not-data-selected:hover:bg-track-voice/12 not-data-selected:hover:border-track-voice/50 data-selected:bg-track-voice/15',
    WAVE: 'fill-track-voice/60 group-data-selected:fill-track-voice/90',
    GHOST: 'bg-track-voice/8 border-track-voice',
  },
} as const satisfies Record<AudioAssetTag, TrackColorClasses>

export const TRACK_KIND_ICON = {
  sfx: Zap,
  music: Music,
  dialog: Mic,
} as const

/** Choices in the "Add track" menu, in display order. */
export const TRACK_KIND_OPTIONS: readonly TrackKindOption[] = DEFAULT_TRACK_KINDS.map((kind) => ({
  kind,
  label: DEFAULT_TRACK_NAMES[kind],
  icon: TRACK_KIND_ICON[kind],
}))
