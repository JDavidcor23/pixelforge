import Link from 'next/link'

import { LANDING_CTA } from '../../constants'
import { ROUTES } from '@/constants/ROUTES'

export const CtaSection = () => {
  return (
    <section className="relative overflow-hidden bg-black py-32">
      <div className="mx-auto max-w-7xl px-6 text-center">
        <h2 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          <span className="text-white">{LANDING_CTA.TITLE_WHITE} </span>
          <span className="text-cyan-400">{LANDING_CTA.TITLE_ACCENT}</span>
        </h2>

        <p className="mt-6 text-lg text-zinc-400">
          {LANDING_CTA.SUBTITLE}
        </p>

        <Link
          href={ROUTES.EDITOR}
          className="mt-10 inline-block rounded-lg bg-cyan-400 px-10 py-4 text-lg font-bold text-black shadow-[0_0_40px_rgba(0,229,255,0.2)] transition-colors hover:bg-cyan-300"
        >
          {LANDING_CTA.BUTTON}
        </Link>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,229,255,0.04)_0%,transparent_70%)]" />
    </section>
  )
}
