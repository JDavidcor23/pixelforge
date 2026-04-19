import { Palette, Bot, Boxes, Library, Music, Rocket } from 'lucide-react'
import type { FeatureCardProps, PipelineStepProps, NavLink, FooterLink } from '../types'

export const LANDING_NAV = {
  LOGO: 'PIXELFORGE',
  CTA_BUTTON: 'Launch Editor',
} as const

export const LANDING_NAV_LINKS: readonly NavLink[] = [
  { label: 'Features', href: '#features' },
  { label: 'Pipeline', href: '#pipeline' },
  { label: 'Pricing', href: '#pricing' },
] as const

export const LANDING_HERO = {
  HEADLINE_WHITE: 'BUILD WORLDS',
  HEADLINE_ACCENT: 'BIT BY BIT.',
  SUBTITLE:
    'Create, animate, and publish 2D games directly from your browser. PixelForge combines a powerful sprite editor, AI-assisted asset generation, and one-click deployment.',
  CTA_PRIMARY: 'Start Building',
  CTA_SECONDARY: 'Watch Demo',
} as const

export const LANDING_HERO_LABELS = {
  LEFT: ['Sprite Editor', 'AI Generation', 'Scene Builder'] as readonly string[],
  RIGHT: ['Asset Library', 'Sound Manager', 'One-Click Deploy'] as readonly string[],
} as const

export const LANDING_FEATURES = {
  TITLE_WHITE: "THE ARCHITECT'S",
  TITLE_ACCENT: 'TOOLKIT',
  SUBTITLE:
    'Everything you need to go from pixel to published, in one integrated workspace.',
} as const

export const LANDING_FEATURE_CARDS: readonly FeatureCardProps[] = [
  {
    moduleId: 'MOD_01',
    icon: <Palette className="w-full h-full" />,
    title: 'SPRITE STUDIO',
    description:
      'Pixel-perfect manipulation with multi-layer compositing and automatic atlas generation.',
    tags: ['ATLAS EXPORT', 'SKINNING'],
  },
  {
    moduleId: 'MOD_02',
    icon: <Boxes className="w-full h-full" />,
    title: 'SCENE BUILDER',
    description:
      'Visual level design with dynamic tilemapping and physics-aware placement tools.',
    tags: ['RAY-CAST UI', 'TILE-MAP'],
  },
  {
    moduleId: 'MOD_03',
    icon: <Bot className="w-full h-full" />,
    title: 'AI GENERATION',
    description:
      'Generate sprites and assets using Claude and Gemini AI models. Describe what you need, get production-ready art.',
    tags: ['LORA-ADAPTERS', 'ASSET-GEN'],
  },
  {
    moduleId: 'MOD_04',
    icon: <Library className="w-full h-full" />,
    title: 'ASSET LIBRARY',
    description:
      'Organize all your sprites, tilesets, and animations in one searchable, taggable library.',
    tags: ['SMART TAGS', 'COLLECTIONS'],
  },
  {
    moduleId: 'MOD_05',
    icon: <Music className="w-full h-full" />,
    title: 'SOUND MANAGER',
    description:
      'Import, preview, and assign sound effects and music tracks to game events.',
    tags: ['SFX BROWSER', 'MIXER'],
  },
  {
    moduleId: 'MOD_06',
    icon: <Rocket className="w-full h-full" />,
    title: 'ONE-CLICK DEPLOY',
    description:
      'Publish your game directly to Vercel with a single click. Share a live URL instantly.',
    tags: ['VERCEL API', 'LIVE-LINK'],
  },
] as const

export const LANDING_PIPELINE = {
  TITLE_WHITE: 'THE FORGE',
  TITLE_ACCENT: 'PIPELINE',
} as const

export const LANDING_PIPELINE_STEPS: readonly PipelineStepProps[] = [
  {
    stepNumber: '01',
    title: 'CREATE SPRITES',
    description:
      'Import raw assets or use our AI prompt system to generate pixel-art layers. Fine-tune every bit in the Sprite Studio editor.',
  },
  {
    stepNumber: '02',
    title: 'BUILD SCENE',
    description:
      'Drag and drop assets onto the gridded canvas. Attach collision boxes, light sources, and script behaviors using visual logic nodes.',
  },
  {
    stepNumber: '03',
    title: 'PUBLISH',
    description:
      'Instantly compile to optimized WASM and host on the global edge. Reach your audience on any browser-equipped device.',
  },
] as const

export const LANDING_CTA = {
  TITLE_WHITE: 'READY TO',
  TITLE_ACCENT: 'COMPILE?',
  SUBTITLE: 'Join the next generation of browser-based game development.',
  BUTTON: 'Launch the Forge',
} as const

export const LANDING_FOOTER = {
  LOGO: 'PixelForge',
  COPYRIGHT: `\u00A9 ${new Date().getFullYear()} PixelForge. All rights reserved.`,
} as const

export const LANDING_FOOTER_LINKS: readonly FooterLink[] = [
  { label: 'GitHub', href: 'https://github.com', isExternal: true },
  { label: 'Discord', href: 'https://discord.com', isExternal: true },
  { label: 'Docs', href: '/docs', isExternal: false },
] as const
