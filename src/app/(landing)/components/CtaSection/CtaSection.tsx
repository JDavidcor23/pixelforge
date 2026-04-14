import Link from 'next/link'

import { LANDING_CTA } from '../../constants'
import { ROUTES } from '@/constants/ROUTES'

export const CtaSection = () =>
{
  return (
    <section className="relative overflow-hidden bg-[#0a0c10] py-32">
      <div className="bg-grid bg-grid-fade pointer-events-none absolute inset-0 z-0 opacity-50" />
      <div className="mx-auto max-w-7xl px-6 text-center">
        <h2 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          <span className="text-white">{ LANDING_CTA.TITLE_WHITE } </span>
          <span className="text-accent text-shadow-accent">{ LANDING_CTA.TITLE_ACCENT }</span>
        </h2>

        <p className="mt-6 text-lg text-zinc-400">
          { LANDING_CTA.SUBTITLE }
        </p>

        <Link
          href={ ROUTES.EDITOR }
          className="relative z-10 mt-10 inline-block rounded-lg bg-accent px-10 py-4 text-lg font-bold text-black shadow-[0_0_40px_rgba(0,251,251,0.3)] transition-all hover:scale-105 hover:bg-white"
        >
          { LANDING_CTA.BUTTON }
        </Link>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,251,251,0.15)_0%,transparent_70%)]" />
    </section>
  )
}
