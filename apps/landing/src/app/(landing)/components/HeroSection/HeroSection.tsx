import Image from 'next/image'
import Link from 'next/link'

import EditorImage from '@/assets/editor.jpeg'
import { LANDING_HERO, LANDING_HERO_LABELS } from '../../constants'
import { ROUTES } from '@/constants/ROUTES'

export const HeroSection = () =>
{
  return (
    <section className="relative overflow-hidden bg-[#0a0c10] pt-32 pb-24">
      {/* Background Grid */}
      <div className="bg-grid bg-grid-fade pointer-events-none absolute inset-0 z-0" />
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-5xl font-bold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
            { LANDING_HERO.HEADLINE_WHITE }{ ' ' }
            <br />
            <span className="text-accent text-shadow-accent">{ LANDING_HERO.HEADLINE_ACCENT }</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400">
            { LANDING_HERO.SUBTITLE }
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href={ ROUTES.EDITOR }
              className="rounded-lg bg-accent px-8 py-3 text-base font-semibold text-black shadow-[0_0_30px_rgba(0,251,251,0.2)] transition-all hover:scale-105 hover:bg-white"
            >
              { LANDING_HERO.CTA_PRIMARY }
            </Link>
            <button
              className="rounded-lg border border-accent px-8 py-3 text-base font-semibold text-accent transition-all hover:bg-accent/10 hover:scale-105"
            >
              { LANDING_HERO.CTA_SECONDARY }
            </button>
          </div>
        </div>

        <div className="relative mx-auto mt-20 max-w-5xl">
          <div className="flex items-center gap-6">
            <div className="hidden flex-col gap-6 text-right lg:flex">
              { LANDING_HERO_LABELS.LEFT.map( ( label ) => (
                <div key={ label } className="flex items-center justify-end gap-3">
                  <span className="text-sm font-medium text-zinc-400">{ label }</span>
                  <span className="h-px w-8 bg-cyan-400/40" />
                </div>
              ) ) }
            </div>

            <div className="flex-1 overflow-hidden rounded-sm border border-white/10 bg-zinc-900/80 shadow-[0_0_60px_rgba(0,251,251,0.1)]">
              <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-red-500/60" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/60" />
                <span className="h-3 w-3 rounded-full bg-green-500/60" />
                <span className="ml-4 text-xs text-zinc-500">PixelForge Editor</span>
              </div>
              <div className="relative h-64 overflow-hidden sm:h-80">
                <Image
                  src={ EditorImage }
                  alt="PixelForge Editor Preview"
                  fill
                  className="object-cover transition-transform duration-700 hover:scale-105"
                  priority
                />
              </div>
            </div>

            <div className="hidden flex-col gap-6 text-left lg:flex">
              { LANDING_HERO_LABELS.RIGHT.map( ( label ) => (
                <div key={ label } className="flex items-center gap-3">
                  <span className="h-px w-8 bg-cyan-400/40" />
                  <span className="text-sm font-medium text-zinc-400">{ label }</span>
                </div>
              ) ) }
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,251,251,0.1)_0%,transparent_70%)]" />
    </section>
  )
}
