import Link from 'next/link'

import { LANDING_NAV, LANDING_NAV_LINKS } from '../../constants'
import { ROUTES } from '@/constants/ROUTES'

export const Navbar = () => {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-black/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href={ROUTES.HOME} className="text-xl font-bold tracking-widest text-white">
          {LANDING_NAV.LOGO}
        </Link>

        <div className="flex items-center gap-8">
          <ul className="hidden items-center gap-6 md:flex">
            {LANDING_NAV_LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="text-sm text-zinc-400 transition-colors hover:text-white"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <Link
            href={ROUTES.EDITOR}
            className="rounded-lg bg-cyan-400 px-5 py-2 text-sm font-semibold text-black transition-colors hover:bg-cyan-300"
          >
            {LANDING_NAV.CTA_BUTTON}
          </Link>
        </div>
      </div>
    </nav>
  )
}
