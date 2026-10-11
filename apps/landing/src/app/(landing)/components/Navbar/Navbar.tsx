import Link from 'next/link'

import { Wordmark } from '../Wordmark/Wordmark'
import { LANDING_NAV, LANDING_NAV_LINKS } from '../../constants'
import { ROUTES } from '@/constants/ROUTES'
import { EDITOR_APP_URL } from '@/constants/env'

export const Navbar = () =>
{
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#121419]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href={ ROUTES.HOME } aria-label={ LANDING_NAV.LOGO_LABEL }>
          <Wordmark className="text-xl font-bold uppercase tracking-widest text-white" />
        </Link>

        <div className="flex items-center gap-8">
          <ul className="hidden items-center gap-6 md:flex">
            { LANDING_NAV_LINKS.map( ( link ) => (
              <li key={ link.label }>
                <a
                  href={ link.href }
                  className="text-sm text-zinc-400 transition-colors hover:text-white"
                >
                  { link.label }
                </a>
              </li>
            ) ) }
          </ul>

          <a
            href={ EDITOR_APP_URL }
            className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-black shadow-[0_0_20px_rgba(0,251,251,0.2)] transition-all hover:scale-105 hover:bg-white"
          >
            { LANDING_NAV.CTA_BUTTON }
          </a>
        </div>
      </div>
    </nav>
  )
}
