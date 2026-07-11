import type { RgbaColor, ToolDefinition } from '@/app/editor/types'

export const SPRITE_EDITOR_CANVAS = {
  DEFAULT_WIDTH: 32,
  DEFAULT_HEIGHT: 32,
  MIN_ZOOM: 1,
  MAX_ZOOM: 40,
  DEFAULT_ZOOM: 16,
  GRID_LINE_COLOR: '#1a1a2e',
  GRID_LINE_WIDTH: 0.5,
} as const

export const SPRITE_EDITOR_COLORS = {
  BACKGROUND: '#0f1115',
  SURFACE: '#1a1a2e',
  SURFACE_LIGHT: '#252540',
  ACCENT: '#00f5ff',
  ACCENT_HOVER: '#00d4db',
  TEXT_PRIMARY: '#ededed',
  TEXT_SECONDARY: '#8888aa',
  BORDER: 'rgba(255,255,255,0.1)',
  TRANSPARENT_CHECKER_A: '#2a2a3e',
  TRANSPARENT_CHECKER_B: '#1e1e30',
  MAX_PALETTE_COLORS: 32,
} as const

export const SPRITE_EDITOR_TOOLS: readonly ToolDefinition[] = [
  { type: 'pencil', label: 'Pencil', shortcut: 'P', iconName: 'Pencil' },
  { type: 'eraser', label: 'Eraser', shortcut: 'E', iconName: 'Eraser' },
  { type: 'bucket', label: 'Paint Bucket', shortcut: 'G', iconName: 'PaintBucket' },
  { type: 'eyedropper', label: 'Eyedropper', shortcut: 'I', iconName: 'Pipette' },
  { type: 'select', label: 'Select', shortcut: 'M', iconName: 'SquareDashed' },
  { type: 'transform', label: 'Transform', shortcut: 'V', iconName: 'Move' },
] as const

export const SPRITE_EDITOR_DEFAULTS = {
  PRIMARY_COLOR: { r: 0, g: 245, b: 255, a: 255 } as RgbaColor,
  SECONDARY_COLOR: { r: 0, g: 0, b: 0, a: 0 } as RgbaColor,
  LAYER_NAME_PREFIX: 'Layer',
} as const

export const SPRITE_EDITOR_HISTORY = {
  MAX_ENTRIES: 50,
} as const

export const SPRITE_EDITOR_TIMELINE = {
  DEFAULT_FPS: 12,
  DEFAULT_FRAME_DURATION_MS: 83,
  MIN_FPS: 1,
  MAX_FPS: 60,
} as const

export const SPRITE_EDITOR_LAYER = {
  DEFAULT_OPACITY: 100,
  MIN_OPACITY: 0,
  MAX_OPACITY: 100,
} as const

export const SPRITE_EDITOR_VIEWPORT = {
  PERCENTAGE_MULTIPLIER: 100,
  ZOOM_STEP: 1,
} as const

export const SPRITE_EDITOR_KEYBOARD = {
  UNDO: 'ctrl+z',
  REDO: 'ctrl+shift+z',
  PENCIL: 'p',
  ERASER: 'e',
  BUCKET: 'g',
  EYEDROPPER: 'i',
  SELECT: 'm',
  TRANSFORM: 'v',
  ZOOM_IN: 'ctrl+=',
  ZOOM_OUT: 'ctrl+-',
} as const

export const PIXELLAB_ANIMATION = {
  DEFAULT_N_FRAMES: 4,
  DEFAULT_ACTION: 'walk',
  DEFAULT_DIRECTION: 'south',
  DEFAULT_VIEW: 'side',
  DEFAULT_FRAME_DURATION_MS: 120,
  ACTIONS: ['idle', 'walk', 'run', 'attack', 'jump'],
  DIRECTIONS: [
    'north',
    'north-east',
    'east',
    'south-east',
    'south',
    'south-west',
    'west',
    'north-west',
  ],
  FRAME_OPTIONS: [3, 4, 6, 8],
} as const

export const AI_OUTPUT_ENV = 'AI_OUTPUT_DIR' // dir Codex writes images to, e.g. ~/.codex/generated_images
export const CODEX_GENERATE_ROUTE = '/api/ai/codex-generate'
export const CODEX_TIMEOUT_MS = 180000 // codex exec is an agent loop; allow generous time
export const CODEX_BASE_PROMPT =
  'Generate a 64x64 pixel art sprite, limited palette of max 16 colors, no anti-aliasing, ' +
  'transparent background, full body centered, retro 16-bit style. Subject: '
export const QUANTIZE_DEFAULTS = {
  COLORS: 16,
  ITERATIONS: 12,
  SATURATION_WEIGHT: 6, // weight = 1 + SATURATION_WEIGHT * saturation
  ALPHA_THRESHOLD: 0.5,
} as const


