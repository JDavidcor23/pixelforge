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
    icon: <Palette className="w-full h-full" />,
    title: 'SPRITE EDITOR',
    description:
      'Draw, animate, and export sprites with a full-featured pixel art canvas powered by Konva.js.',
  },
  {
    icon: <Bot className="w-full h-full" />,
    title: 'AI GENERATION',
    description:
      'Generate sprites and assets using Claude and Gemini AI models. Describe what you need, get production-ready art.',
  },
  {
    icon: <Boxes className="w-full h-full" />,
    title: 'SCENE BUILDER',
    description:
      'Drag-and-drop your assets into game scenes. Set collisions, layers, and camera behavior visually.',
  },
  {
    icon: <Library className="w-full h-full" />,
    title: 'ASSET LIBRARY',
    description:
      'Organize all your sprites, tilesets, and animations in one searchable, taggable library.',
  },
  {
    icon: <Music className="w-full h-full" />,
    title: 'SOUND MANAGER',
    description:
      'Import, preview, and assign sound effects and music tracks to game events.',
  },
  {
    icon: <Rocket className="w-full h-full" />,
    title: 'ONE-CLICK DEPLOY',
    description:
      'Publish your game directly to Vercel with a single click. Share a live URL instantly.',
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
      'Start with the pixel editor or let AI generate your game assets. Build sprite sheets, animations, and tilesets.',
  },
  {
    stepNumber: '02',
    title: 'BUILD SCENES',
    description:
      'Arrange your assets into game levels. Add physics, collisions, and interactive elements with the visual scene builder.',
  },
  {
    stepNumber: '03',
    title: 'DEPLOY & SHARE',
    description:
      'Hit publish and your game goes live on Vercel. Get a shareable URL in seconds, not hours.',
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
